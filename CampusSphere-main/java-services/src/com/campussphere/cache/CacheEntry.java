package com.campussphere.cache;

import java.io.Serializable;

/**
 * A single cache entry with TTL + LRU metadata.
 * Serializable so it survives JVM restarts (written to disk).
 */
public class CacheEntry implements Serializable {
    private static final long serialVersionUID = 1L;

    public final String key;
    public final String value;
    public final long   expiresAt;   // epoch ms
    public long         lastAccessed; // epoch ms — updated on every get

    public CacheEntry(String key, String value, long ttlMs) {
        this.key          = key;
        this.value        = value;
        this.expiresAt    = System.currentTimeMillis() + ttlMs;
        this.lastAccessed = System.currentTimeMillis();
    }

    public boolean isExpired() {
        return System.currentTimeMillis() > expiresAt;
    }
}
