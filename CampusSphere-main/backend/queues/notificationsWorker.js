const Notification = require("../models/Notification");
const logger = require("../utils/logger");
const { notificationsQueue } = require("./index");

const SERVICE = "notificationsWorker";

notificationsQueue.process(async (job, done) => {
  try {
    const { payload } = job.data;
    if (!payload) throw new Error("Missing payload");

    // payload should be a single notification object or an array
    if (Array.isArray(payload)) {
      await Notification.insertMany(payload);
      logger.info(SERVICE, "Inserted batch notifications", {
        count: payload.length,
      });
    } else {
      await Notification.create(payload);
      logger.info(SERVICE, "Inserted notification");
    }

    done();
  } catch (err) {
    logger.error(SERVICE, "Failed to insert notification", {
      error: err.message,
      job: job.id,
    });
    done(err);
  }
});

module.exports = notificationsQueue;
