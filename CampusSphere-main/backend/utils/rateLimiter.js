// In-memory Token Bucket Rate Limiter (no Redis needed)
// Each IP gets a bucket that refills at a fixed rate

const buckets = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute window
const DEFAULT_MAX = 100;      // default requests per window

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > WINDOW_MS * 2) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Token Bucket Rate Limiter Middleware
 * @param {number} maxRequests - max requests per window
 * @param {number} windowMs - window duration in ms
 */
const rateLimiter = (maxRequests = DEFAULT_MAX, windowMs = WINDOW_MS) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!buckets.has(key)) {
      buckets.set(key, { tokens: maxRequests, lastRefill: now });
    }

    const bucket = buckets.get(key);
    const elapsed = now - bucket.lastRefill;

    // Refill tokens proportionally
    if (elapsed >= windowMs) {
      bucket.tokens = maxRequests;
      bucket.lastRefill = now;
    } else {
      const refill = Math.floor((elapsed / windowMs) * maxRequests);
      bucket.tokens = Math.min(maxRequests, bucket.tokens + refill);
      if (refill > 0) bucket.lastRefill = now;
    }

    if (bucket.tokens <= 0) {
      res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please slow down.",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    bucket.tokens -= 1;
    res.setHeader("X-RateLimit-Remaining", bucket.tokens);
    res.setHeader("X-RateLimit-Limit", maxRequests);
    next();
  };
};

module.exports = rateLimiter;
