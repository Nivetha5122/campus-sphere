package com.campussphere.queue;

import java.io.Serializable;
import java.util.UUID;

/**
 * A message in the internal queue.
 * TTL: message is discarded if not consumed before expiresAt.
 */
public class Message implements Serializable {
    private static final long serialVersionUID = 1L;

    public final String id;
    public final String topic;
    public final String payload;  // JSON string
    public final long   createdAt;
    public final long   expiresAt;
    public int          retries;

    public Message(String topic, String payload, long ttlMs) {
        this.id        = UUID.randomUUID().toString();
        this.topic     = topic;
        this.payload   = payload;
        this.createdAt = System.currentTimeMillis();
        this.expiresAt = this.createdAt + ttlMs;
        this.retries   = 0;
    }

    public boolean isExpired() {
        return System.currentTimeMillis() > expiresAt;
    }

    @Override
    public String toString() {
        return String.format("{id:%s, topic:%s, expires_in:%ds}", id, topic, (expiresAt - System.currentTimeMillis())/1000);
    }
}
