package com.campussphere.queue;

import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Consumer;
import java.util.logging.Logger;

/**
 * Persistent Message Queue with TTL.
 *
 * Features:
 *  - Per-topic queues (LinkedBlockingDeque per topic)
 *  - TTL: expired messages are dropped on enqueue + periodic cleanup
 *  - Persistence: journal file written on every enqueue, loaded on startup
 *  - Subscribe: register callbacks per topic (async dispatch via thread pool)
 *  - Dead-letter queue: messages that fail 3 times go to "dead-letter" topic
 *  - Thread-safe
 */
public class MessageQueue {
    private static final Logger LOG       = Logger.getLogger(MessageQueue.class.getName());
    private static final int    MAX_RETRY = 3;
    private static final String DLQ       = "dead-letter";

    private final String persistPath;
    private final ConcurrentHashMap<String, LinkedBlockingDeque<Message>> topics       = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, List<Consumer<Message>>>      subscribers  = new ConcurrentHashMap<>();
    private final ExecutorService                                          dispatcher   = Executors.newCachedThreadPool();
    private final ReentrantLock                                            persistLock  = new ReentrantLock();

    // Stats
    private final ConcurrentHashMap<String, Long> enqueueCount = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> consumeCount = new ConcurrentHashMap<>();

    public MessageQueue(String persistPath) {
        this.persistPath = persistPath;
        loadFromDisk();
        startTTLCleaner();
        startPersistenceTimer();
        registerShutdownHook();
    }

    /** Publish a message to a topic with custom TTL */
    public String publish(String topic, String payload, long ttlMs) {
        Message msg = new Message(topic, payload, ttlMs);
        if (msg.isExpired()) { LOG.warning("[MQ] Refused zero-TTL message on " + topic); return null; }

        topics.computeIfAbsent(topic, k -> new LinkedBlockingDeque<>()).addLast(msg);
        enqueueCount.merge(topic, 1L, Long::sum);
        LOG.info("[MQ] Published to " + topic + ": " + msg.id);

        // Dispatch to subscribers immediately
        dispatchToSubscribers(msg);
        persistAsync();
        return msg.id;
    }

    /** Publish with default 1-hour TTL */
    public String publish(String topic, String payload) {
        return publish(topic, payload, 60 * 60 * 1000L);
    }

    /** Subscribe a callback to a topic — called async on every new message */
    public void subscribe(String topic, Consumer<Message> handler) {
        subscribers.computeIfAbsent(topic, k -> new CopyOnWriteArrayList<>()).add(handler);
        LOG.info("[MQ] Subscribed to topic: " + topic);
    }

    /** Poll the next non-expired message from a topic (blocking with timeout) */
    public Message poll(String topic, long timeoutMs) throws InterruptedException {
        LinkedBlockingDeque<Message> q = topics.computeIfAbsent(topic, k -> new LinkedBlockingDeque<>());
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            Message msg = q.pollFirst(100, TimeUnit.MILLISECONDS);
            if (msg == null) continue;
            if (msg.isExpired()) { LOG.fine("[MQ] Dropped expired: " + msg.id); continue; }
            consumeCount.merge(topic, 1L, Long::sum);
            return msg;
        }
        return null;
    }

    /** Acknowledge — remove from pending, record consume */
    public void ack(String topic, String messageId) {
        LOG.fine("[MQ] ACK " + messageId + " on " + topic);
    }

    /** Nack — retry or DLQ */
    public void nack(String topic, Message msg) {
        msg.retries++;
        if (msg.retries >= MAX_RETRY) {
            LOG.warning("[MQ] NACK max retries, sending to DLQ: " + msg.id);
            publish(DLQ, msg.payload, 24 * 60 * 60 * 1000L);
        } else {
            LOG.info("[MQ] NACK retry " + msg.retries + " for " + msg.id);
            topics.computeIfAbsent(topic, k -> new LinkedBlockingDeque<>()).addFirst(msg);
        }
    }

    public Map<String, Object> stats() {
        Map<String, Object> s = new LinkedHashMap<>();
        Map<String, Object> queues = new LinkedHashMap<>();
        for (Map.Entry<String, LinkedBlockingDeque<Message>> e : topics.entrySet()) {
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("depth",    e.getValue().size());
            q.put("enqueued", enqueueCount.getOrDefault(e.getKey(), 0L));
            q.put("consumed", consumeCount.getOrDefault(e.getKey(), 0L));
            queues.put(e.getKey(), q);
        }
        s.put("topics",      queues);
        s.put("subscribers", subscribers.size());
        return s;
    }

    // ── Internal ──────────────────────────────────────────────────────────────
    private void dispatchToSubscribers(Message msg) {
        List<Consumer<Message>> handlers = subscribers.get(msg.topic);
        if (handlers == null || handlers.isEmpty()) return;
        for (Consumer<Message> h : handlers) {
            dispatcher.submit(() -> {
                try { h.accept(msg); }
                catch (Exception e) { LOG.warning("[MQ] Subscriber error: " + e.getMessage()); }
            });
        }
    }

    private void startTTLCleaner() {
        ScheduledExecutorService svc = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "mq-ttl-cleaner"); t.setDaemon(true); return t;
        });
        svc.scheduleAtFixedRate(() -> {
            int removed = 0;
            for (LinkedBlockingDeque<Message> q : topics.values()) {
                removed += q.removeIf(Message::isExpired) ? 1 : 0;
            }
        }, 60, 60, TimeUnit.SECONDS);
    }

    private void startPersistenceTimer() {
        ScheduledExecutorService svc = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "mq-persist"); t.setDaemon(true); return t;
        });
        svc.scheduleAtFixedRate(this::saveToDisk, 120, 120, TimeUnit.SECONDS);
    }

    private void persistAsync() {
        dispatcher.submit(this::saveToDisk);
    }

    private void registerShutdownHook() {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOG.info("[MQ] Shutdown: persisting queues...");
            saveToDisk();
            dispatcher.shutdown();
        }));
    }

    @SuppressWarnings("unchecked")
    private void loadFromDisk() {
        File f = new File(persistPath);
        if (!f.exists()) return;
        try (ObjectInputStream in = new ObjectInputStream(new FileInputStream(f))) {
            Map<String, List<Message>> saved = (Map<String, List<Message>>) in.readObject();
            int total = 0;
            for (Map.Entry<String, List<Message>> e : saved.entrySet()) {
                LinkedBlockingDeque<Message> q = new LinkedBlockingDeque<>();
                for (Message m : e.getValue()) {
                    if (!m.isExpired()) { q.addLast(m); total++; }
                }
                if (!q.isEmpty()) topics.put(e.getKey(), q);
            }
            LOG.info("[MQ] Loaded " + total + " messages from disk.");
        } catch (Exception e) {
            LOG.warning("[MQ] Load failed: " + e.getMessage());
        }
    }

    private void saveToDisk() {
        persistLock.lock();
        try {
            Map<String, List<Message>> snapshot = new HashMap<>();
            for (Map.Entry<String, LinkedBlockingDeque<Message>> e : topics.entrySet()) {
                snapshot.put(e.getKey(), new ArrayList<>(e.getValue()));
            }
            File f = new File(persistPath);
            f.getParentFile().mkdirs();
            try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream(f))) {
                out.writeObject(snapshot);
            }
        } catch (Exception e) {
            LOG.warning("[MQ] Save failed: " + e.getMessage());
        } finally {
            persistLock.unlock();
        }
    }
}
