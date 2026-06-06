package com.campussphere.cache;

import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.logging.Logger;

/**
 * TTL + LRU + Persistent Cache.
 *
 * Design:
 *  - LRU eviction via LinkedHashMap (access-ordered)
 *  - TTL per entry checked on every get/put
 *  - Persistence: serialises the full map to disk every 60s + on shutdown
 *  - Thread-safe via ReadWriteLock (multiple readers, single writer)
 *  - Background thread expires TTL entries every 30s
 *  - Max capacity configurable; LRU evicts when full
 */
public class PersistentLRUCache {
    private static final Logger LOG = Logger.getLogger(PersistentLRUCache.class.getName());

    private final int maxCapacity;
    private final String persistPath;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    // Access-ordered LinkedHashMap = LRU semantics
    private final LinkedHashMap<String, CacheEntry> store;

    // Stats
    private long hits   = 0;
    private long misses = 0;
    private long evictions = 0;

    public PersistentLRUCache(int maxCapacity, String persistPath) {
        this.maxCapacity = maxCapacity;
        this.persistPath = persistPath;

        this.store = new LinkedHashMap<>(maxCapacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, CacheEntry> eldest) {
                if (size() > PersistentLRUCache.this.maxCapacity) {
                    evictions++;
                    LOG.info("[Cache] LRU evict: " + eldest.getKey());
                    return true;
                }
                return false;
            }
        };

        loadFromDisk();
        startTTLCleaner();
        startPersistenceTimer();
        registerShutdownHook();
    }

    /** Put with custom TTL in milliseconds */
    public void put(String key, String value, long ttlMs) {
        lock.writeLock().lock();
        try {
            store.put(key, new CacheEntry(key, value, ttlMs));
            LOG.fine("[Cache] PUT " + key + " ttl=" + ttlMs + "ms");
        } finally {
            lock.writeLock().unlock();
        }
    }

    /** Put with default 5-minute TTL */
    public void put(String key, String value) {
        put(key, value, 5 * 60 * 1000L);
    }

    /** Get — returns null if missing or expired */
    public String get(String key) {
        lock.writeLock().lock(); // write lock because LinkedHashMap mutates on access
        try {
            CacheEntry entry = store.get(key);
            if (entry == null) { misses++; return null; }
            if (entry.isExpired()) {
                store.remove(key);
                misses++;
                LOG.fine("[Cache] MISS (expired) " + key);
                return null;
            }
            entry.lastAccessed = System.currentTimeMillis();
            hits++;
            LOG.fine("[Cache] HIT " + key);
            return entry.value;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void invalidate(String key) {
        lock.writeLock().lock();
        try { store.remove(key); LOG.info("[Cache] INVALIDATE " + key); }
        finally { lock.writeLock().unlock(); }
    }

    /** Invalidate all keys matching a prefix */
    public void invalidatePrefix(String prefix) {
        lock.writeLock().lock();
        try {
            store.keySet().removeIf(k -> {
                if (k.startsWith(prefix)) { LOG.info("[Cache] INVALIDATE_PREFIX " + k); return true; }
                return false;
            });
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void clear() {
        lock.writeLock().lock();
        try { store.clear(); }
        finally { lock.writeLock().unlock(); }
    }

    public Map<String, Object> stats() {
        lock.readLock().lock();
        try {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("size",      store.size());
            s.put("capacity",  maxCapacity);
            s.put("hits",      hits);
            s.put("misses",    misses);
            s.put("evictions", evictions);
            s.put("hitRate",   hits + misses == 0 ? 0.0 : (double) hits / (hits + misses));
            return s;
        } finally {
            lock.readLock().unlock();
        }
    }

    // ── Background: remove expired entries every 30s ─────────────────────────
    private void startTTLCleaner() {
        ScheduledExecutorService svc = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "cache-ttl-cleaner");
            t.setDaemon(true);
            return t;
        });
        svc.scheduleAtFixedRate(() -> {
            lock.writeLock().lock();
            try {
                int before = store.size();
                store.entrySet().removeIf(e -> e.getValue().isExpired());
                int removed = before - store.size();
                if (removed > 0) LOG.info("[Cache] TTL cleaner removed " + removed + " entries");
            } finally {
                lock.writeLock().unlock();
            }
        }, 30, 30, TimeUnit.SECONDS);
    }

    // ── Persist to disk every 60s ─────────────────────────────────────────────
    private void startPersistenceTimer() {
        ScheduledExecutorService svc = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "cache-persist");
            t.setDaemon(true);
            return t;
        });
        svc.scheduleAtFixedRate(this::saveToDisk, 60, 60, TimeUnit.SECONDS);
    }

    private void registerShutdownHook() {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOG.info("[Cache] Shutdown: persisting to disk...");
            saveToDisk();
        }));
    }

    @SuppressWarnings("unchecked")
    private void loadFromDisk() {
        File f = new File(persistPath);
        if (!f.exists()) { LOG.info("[Cache] No persist file found, starting fresh."); return; }
        try (ObjectInputStream in = new ObjectInputStream(new FileInputStream(f))) {
            Map<String, CacheEntry> loaded = (Map<String, CacheEntry>) in.readObject();
            long now = System.currentTimeMillis();
            int loaded_count = 0;
            for (Map.Entry<String, CacheEntry> e : loaded.entrySet()) {
                if (!e.getValue().isExpired()) { store.put(e.getKey(), e.getValue()); loaded_count++; }
            }
            LOG.info("[Cache] Loaded " + loaded_count + " valid entries from disk (skipped expired).");
        } catch (Exception e) {
            LOG.warning("[Cache] Failed to load from disk: " + e.getMessage());
        }
    }

    private void saveToDisk() {
        lock.readLock().lock();
        Map<String, CacheEntry> snapshot;
        try { snapshot = new HashMap<>(store); }
        finally { lock.readLock().unlock(); }

        File f = new File(persistPath);
        f.getParentFile().mkdirs();
        try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream(f))) {
            out.writeObject(snapshot);
            LOG.fine("[Cache] Persisted " + snapshot.size() + " entries to disk.");
        } catch (Exception e) {
            LOG.warning("[Cache] Persist failed: " + e.getMessage());
        }
    }
}
