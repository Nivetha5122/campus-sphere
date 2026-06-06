const Queue = require("bull");
require("dotenv").config();

const redisUrl =
  process.env.REDIS_URL ||
  (process.env.REDIS_HOST
    ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
    : null);

// If no Redis is configured, export stub queues that immediately call their
// error handler so the fallback direct-DB path is used everywhere.
if (!redisUrl) {
  console.warn("[Queue] No REDIS_URL configured — queues disabled, using direct DB writes.");

  const stubQueue = {
    add: () => Promise.reject(new Error("Queue disabled (no Redis)")),
    process: () => {},
    on: () => {},
  };

  module.exports = {
    notesQueue: stubQueue,
    notificationsQueue: stubQueue,
  };
} else {
  const notesQueue          = new Queue("notes",         redisUrl);
  const notificationsQueue  = new Queue("notifications", redisUrl);

  module.exports = { notesQueue, notificationsQueue };
}
