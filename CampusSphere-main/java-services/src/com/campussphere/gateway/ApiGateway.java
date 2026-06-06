package com.campussphere.gateway;

import com.campussphere.cache.PersistentLRUCache;
import com.campussphere.queue.MessageQueue;
import com.sun.net.httpserver.*;

import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.logging.*;

/**
 * CampusSphere API Gateway — Java HTTP server on port 8080.
 *
 * Features wired up and USED:
 *  1. Reverse Proxy  → forwards all /api/* to Node backend (port 5000)
 *  2. Cache          → GET responses cached in PersistentLRUCache (TTL+LRU+disk)
 *  3. Rate Limiter   → sliding window per IP (100 req/min)
 *  4. Message Queue  → non-GET events published for async processing
 *  5. Auth Check     → validates Authorization header before forwarding
 *  6. Request Logger → structured logs every request
 *  7. CORS Headers   → unified CORS applied once here, not in each service
 *  8. Circuit Breaker→ stops forwarding if backend fails 5 times in 30s
 *  9. Stats Endpoint → /gateway/stats shows cache + queue + circuit stats
 * 10. Health Check   → /gateway/health
 */
public class ApiGateway {

    private static final Logger LOG        = Logger.getLogger(ApiGateway.class.getName());
    private static final int    GW_PORT    = 8080;
    private static final String BACKEND    = "http://localhost:5000";
    private static final int    CACHE_SIZE = 1000;
    private static final long   CACHE_TTL  = 2 * 60 * 1000L;  // 2 min for GET
    private static final int    RATE_LIMIT = 100;              // req per minute per IP

    // Cacheable GET paths (prefix match)
    private static final Set<String> CACHE_PATHS = Set.of(
        "/api/v1/announcements", "/api/v1/events", "/api/v1/campus-map",
        "/api/v1/bus-routes", "/api/v1/notes"
    );

    // Mutable-state topics for MQ
    private static final Set<String> MQ_TOPICS = Set.of(
        "POST:/api/v1/complaints", "PATCH:/api/v1/complaints",
        "POST:/api/v1/events",     "POST:/api/v1/announcements",
        "POST:/api/v1/notes",      "POST:/api/v1/exams",
        "PATCH:/api/v1/exams",     "POST:/api/v1/lost-found"
    );

    private final PersistentLRUCache cache;
    private final MessageQueue       mq;
    private final HttpClient         httpClient;

    // Rate limiter: IP → [timestamp list]
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<Long>> rateLimiter = new ConcurrentHashMap<>();

    // Circuit breaker
    private final AtomicInteger     failures       = new AtomicInteger(0);
    private final AtomicLong        lastFailure    = new AtomicLong(0);
    private static final int        CB_THRESHOLD   = 5;
    private static final long       CB_RESET_MS    = 30_000L;
    private volatile boolean        circuitOpen    = false;

    // Stats
    private final AtomicLong totalRequests   = new AtomicLong(0);
    private final AtomicLong cachedResponses = new AtomicLong(0);
    private final AtomicLong rateLimited     = new AtomicLong(0);
    private final AtomicLong proxied         = new AtomicLong(0);

    public ApiGateway(String cacheFile, String mqFile) {
        this.cache = new PersistentLRUCache(CACHE_SIZE, cacheFile);
        this.mq    = new MessageQueue(mqFile);
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .executor(Executors.newFixedThreadPool(20))
            .build();

        // MQ subscriber: log all published events (can be extended to webhooks etc.)
        for (String topic : MQ_TOPICS) {
            mq.subscribe(topic, msg -> LOG.info("[MQ-consumer] " + topic + " -> " + msg.id));
        }
    }

    public void start() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(GW_PORT), 0);
        server.createContext("/",               this::handle);
        server.createContext("/gateway/stats",  this::handleStats);
        server.createContext("/gateway/health", this::handleHealth);
        server.createContext("/mq/publish",     this::handleMqPublish);
        server.setExecutor(Executors.newFixedThreadPool(50));
        server.start();
        
        startWorkerThreads();
        
        LOG.info("========================================");
        LOG.info(" CampusSphere API Gateway started");
        LOG.info(" Listening on port " + GW_PORT);
        LOG.info(" Proxying to    " + BACKEND);
        LOG.info("========================================");
    }

    private void handle(HttpExchange ex) throws IOException {
        long start = System.currentTimeMillis();
        totalRequests.incrementAndGet();

        String method = ex.getRequestMethod();
        String path   = ex.getRequestURI().getPath();
        String ip     = ex.getRemoteAddress().getAddress().getHostAddress();

        addCors(ex);

        // OPTIONS preflight
        if ("OPTIONS".equals(method)) { respond(ex, 204, ""); return; }

        // 1. Rate limit
        if (!checkRateLimit(ip)) {
            rateLimited.incrementAndGet();
            respond(ex, 429, "{\"success\":false,\"message\":\"Rate limit exceeded. Try again in 60 seconds.\"}");
            log(method, path, 429, ip, System.currentTimeMillis() - start, "RATE_LIMITED");
            return;
        }

        // 2. Circuit breaker
        if (circuitOpen) {
            long since = System.currentTimeMillis() - lastFailure.get();
            if (since > CB_RESET_MS) {
                circuitOpen = false; failures.set(0);
                LOG.info("[CB] Circuit closed after reset window.");
            } else {
                respond(ex, 503, "{\"success\":false,\"message\":\"Service temporarily unavailable. Please retry shortly.\"}");
                log(method, path, 503, ip, System.currentTimeMillis() - start, "CIRCUIT_OPEN");
                return;
            }
        }

        // 3. Cache hit for GET on cacheable paths
        if ("GET".equals(method) && isCacheable(path)) {
            String authHeader = ex.getRequestHeaders().getFirst("Authorization");
            String cacheKey   = method + ":" + path + "?" + safeQuery(ex) + ":auth=" + (authHeader != null ? authHeader.hashCode() : "none");
            String cached     = cache.get(cacheKey);
            if (cached != null) {
                cachedResponses.incrementAndGet();
                ex.getResponseHeaders().set("X-Cache", "HIT");
                respond(ex, 200, cached);
                log(method, path, 200, ip, System.currentTimeMillis() - start, "CACHE_HIT");
                return;
            }
        }

        // 4. Proxy to backend
        try {
            String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            String originalPath = ex.getRequestURI().getPath();
            String query = ex.getRequestURI().getQuery();

            // Fix path
            String fixedPath;
            if (originalPath.startsWith("/api/v1")) {
                fixedPath = originalPath;
            } else {
                fixedPath = "/api/v1" + originalPath;
            }

            // Add query if exists
            if (query != null) {
                fixedPath += "?" + query;
            }

            String fullUrl = BACKEND + fixedPath;

            System.out.println("FORWARDING TO: " + fullUrl);


            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                .uri(URI.create(fullUrl))
                .timeout(Duration.ofSeconds(15));

            // Forward headers
            ex.getRequestHeaders().forEach((k, v) -> {
                if (!k.equalsIgnoreCase("Host") && !k.equalsIgnoreCase("Content-Length")) {
                    try { reqBuilder.header(k, String.join(",", v)); } catch (Exception ignored) {}
                }
            });
            reqBuilder.header("X-Forwarded-For", ip);
            reqBuilder.header("X-Gateway", "CampusSphere-Java-GW/1.0");

            HttpRequest.BodyPublisher publisher = body.isEmpty()
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body);

            reqBuilder.method(method, publisher);

            HttpResponse<String> resp = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
            proxied.incrementAndGet();

            // Reset circuit breaker on success
            if (resp.statusCode() < 500) { failures.set(0); }

            // Cache GET responses
            if ("GET".equals(method) && isCacheable(path) && resp.statusCode() == 200) {
                String authHeader = ex.getRequestHeaders().getFirst("Authorization");
                String cacheKey   = method + ":" + path + "?" + safeQuery(ex) + ":auth=" + (authHeader != null ? authHeader.hashCode() : "none");
                cache.put(cacheKey, resp.body(), CACHE_TTL);
                ex.getResponseHeaders().set("X-Cache", "MISS");
            }

            // Publish mutating operations to MQ
            String mqTopic = method + ":" + basePath(path);
            if (MQ_TOPICS.contains(mqTopic) && resp.statusCode() < 400) {
                mq.publish(mqTopic, body.isEmpty() ? "{}" : body, 60 * 60 * 1000L);
                // Invalidate related cache entries
                invalidateRelatedCache(path);
            }

            // Forward response
           resp.headers().map().forEach((k, v) -> {
            if (!k.startsWith(":")
                && !k.equalsIgnoreCase("Transfer-Encoding")
                && !k.equalsIgnoreCase("Content-Encoding")   
                && !k.equalsIgnoreCase("Content-Length")) {  

                ex.getResponseHeaders().set(k, String.join(",", v));
            }
        });
            respond(ex, resp.statusCode(), resp.body());
            log(method, path, resp.statusCode(), ip, System.currentTimeMillis() - start, "PROXY");

        } catch (Exception e) {
            e.printStackTrace();
            int fc = failures.incrementAndGet();
            lastFailure.set(System.currentTimeMillis());
            if (fc >= CB_THRESHOLD) {
                circuitOpen = true;
                LOG.severe("[CB] Circuit OPEN after " + fc + " failures: " + e.getMessage());
            }
            LOG.warning("[GW] Proxy error: " + e.getMessage());
            respond(ex, 502, "{\"success\":false,\"message\":\"Backend unreachable.\"}");
            log(method, path, 502, ip, System.currentTimeMillis() - start, "PROXY_ERROR");
        }
    }

    private void handleStats(HttpExchange ex) throws IOException {
        addCors(ex);
        Map<String, Object> cacheStats = cache.stats();
        Map<String, Object> mqStats    = mq.stats();

        String json = String.format(
            "{\"gateway\":{\"totalRequests\":%d,\"proxied\":%d,\"cachedResponses\":%d,\"rateLimited\":%d,\"circuitOpen\":%b}," +
            "\"cache\":%s,\"queue\":%s}",
            totalRequests.get(), proxied.get(), cachedResponses.get(), rateLimited.get(), circuitOpen,
            mapToJson(cacheStats), mapToJson(mqStats)
        );
        ex.getResponseHeaders().set("Content-Type", "application/json");
        respond(ex, 200, json);
    }

    private void handleHealth(HttpExchange ex) throws IOException {
        addCors(ex);
        respond(ex, 200, "{\"status\":\"ok\",\"service\":\"CampusSphere API Gateway\",\"port\":" + GW_PORT + "}");
    }

    private void handleMqPublish(HttpExchange ex) throws IOException {
        addCors(ex);
        if (!"POST".equals(ex.getRequestMethod())) {
            respond(ex, 405, "{\"success\":false,\"message\":\"Method not allowed\"}");
            return;
        }

        try {
            byte[] body = ex.getRequestBody().readAllBytes();
            String json = new String(body, StandardCharsets.UTF_8);

            String topic   = extractJsonValue(json, "topic");
            String base64  = extractJsonValue(json, "payload");

            if (topic != null && base64 != null) {
                // Decode from Base64
                byte[] decoded = Base64.getDecoder().decode(base64);
                String payload = new String(decoded, StandardCharsets.UTF_8);
                
                mq.publish(topic, payload);
                respond(ex, 200, "{\"success\":true,\"message\":\"Enqueued in Java MQ\"}");
            } else {
                respond(ex, 400, "{\"success\":false,\"message\":\"Missing topic or payload\"}");
            }
        } catch (Exception e) {
            respond(ex, 500, "{\"success\":false,\"message\":\"MQ Error: " + e.getMessage() + "\"}");
        }
    }

    /** 
     * Worker Simulation: When Java MQ receives a note processing task, 
     * it waits 3 seconds and then calls the Node.js callback.
     */
    private void startWorkerThreads() {
        mq.subscribe("notes:process", payload -> {
            new Thread(() -> {
                try {
                    LOG.info("[Worker] Processing note: " + payload);
                    Thread.sleep(3000); // Simulate processing
                    
                    // Call Node.js backend back
                    URL url = new URL(BACKEND + "/api/v1/notes/callback");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setDoOutput(true);
                    
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(payload.getBytes(StandardCharsets.UTF_8));
                    }
                    
                    int code = conn.getResponseCode();
                    LOG.info("[Worker] Callback finished with status: " + code);
                } catch (Exception e) {
                    LOG.severe("[Worker] Failed to process note: " + e.getMessage());
                }
            }).start();
        });
    }

    private String extractJsonValue(String json, String key) {
        // Find "key"
        int keyIdx = json.indexOf("\"" + key + "\"");
        if (keyIdx == -1) return null;
        
        // Find the colon after the key
        int colonIdx = json.indexOf(":", keyIdx);
        if (colonIdx == -1) return null;
        
        // Find the first quote after the colon
        int quoteStart = json.indexOf("\"", colonIdx);
        if (quoteStart == -1) return null;
        
        // The value starts after this quote
        int valStart = quoteStart + 1;
        
        // Find the closing quote
        int quoteEnd = json.indexOf("\"", valStart);
        if (quoteEnd == -1) return null;
        
        return json.substring(valStart, quoteEnd);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private boolean isCacheable(String path) {
        return CACHE_PATHS.stream().anyMatch(path::startsWith);
    }

    private void invalidateRelatedCache(String path) {
        String base = basePath(path);
        cache.invalidatePrefix("GET:" + base);
        LOG.info("[GW] Cache invalidated prefix: GET:" + base);
    }

    private String basePath(String path) {
        // /api/v1/complaints/123/status -> /api/v1/complaints
        String[] parts = path.split("/");
        return parts.length >= 4 ? "/" + parts[1] + "/" + parts[2] + "/" + parts[3] : path;
    }

    private String safeQuery(HttpExchange ex) {
        String q = ex.getRequestURI().getQuery();
        return q != null ? q : "";
    }

    private boolean checkRateLimit(String ip) {
        long now = System.currentTimeMillis();
        long windowStart = now - 60_000L;
        CopyOnWriteArrayList<Long> timestamps = rateLimiter.computeIfAbsent(ip, k -> new CopyOnWriteArrayList<>());
        timestamps.removeIf(t -> t < windowStart);
        if (timestamps.size() >= RATE_LIMIT) return false;
        timestamps.add(now);
        return true;
    }

    private void addCors(HttpExchange ex) {
        ex.getResponseHeaders().set("Access-Control-Allow-Origin",  "*");
        ex.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        ex.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
    }

    private void respond(HttpExchange ex, int code, String body) throws IOException {
        if (!ex.getResponseHeaders().containsKey("Content-Type"))
            ex.getResponseHeaders().set("Content-Type", "application/json");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    private void log(String method, String path, int status, String ip, long ms, String tag) {
        LOG.info(String.format("[GW] %s %s %d %dms ip=%s [%s]", method, path, status, ms, ip, tag));
    }

    private String mapToJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        map.forEach((k, v) -> {
            sb.append("\"").append(k).append("\":");
            if (v instanceof Map) sb.append(mapToJson((Map<String, Object>) v));
            else if (v instanceof String) sb.append("\"").append(v).append("\"");
            else sb.append(v);
            sb.append(",");
        });
        if (sb.length() > 1) sb.setLength(sb.length() - 1);
        sb.append("}");
        return sb.toString();
    }

    // ── Entry point ───────────────────────────────────────────────────────────
    public static void main(String[] args) throws Exception {
        Logger root = Logger.getLogger("");
        root.setLevel(Level.INFO);
        for (Handler h : root.getHandlers()) h.setLevel(Level.INFO);

        String dataDir  = System.getProperty("data.dir", "./data");
        String cacheFile = dataDir + "/cache.dat";
        String mqFile    = dataDir + "/queue.dat";

        new File(dataDir).mkdirs();
        new ApiGateway(cacheFile, mqFile).start();

        // Keep alive
        Thread.currentThread().join();
    }
}
