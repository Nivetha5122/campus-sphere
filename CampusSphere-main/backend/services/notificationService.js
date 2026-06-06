const Notification = require("../models/Notification");
const logger = require("../utils/logger");

const SERVICE = "NotificationService";
const JAVA_MQ_URL = "http://localhost:8080/mq/publish";

/** 
 * Helper to notify the Java Message Queue 
 */
async function notifyJavaMQ(topic, payload) {
  try {
    // Base64 encode to avoid quote-parsing issues in Java manual parser
    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadStr).toString("base64");
    
    await fetch(JAVA_MQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, payload: base64Payload })
    });
  } catch (err) {
    logger.error(SERVICE, "Failed to bridge to Java MQ", { error: err.message });
  }
}

exports.createNotification = async ({
  recipient,
  type,
  title,
  message,
  link,
  meta,
}) => {
  try {
    const payload = { recipient, type, title, message, link, meta };
    
    // 1. Save to DB for frontend polling
    const doc = await Notification.create(payload);
    
    // 2. Bridge to Java MQ for system-wide auditing/processing
    notifyJavaMQ("notification:single", payload);
    
    return doc;
  } catch (err) {
    logger.error(SERVICE, "Failed to create notification", {
      error: err.message,
    });
  }
};

exports.broadcastNotification = async (recipientIds, payload) => {
  try {
    if (!recipientIds?.length) return;
    const docs = recipientIds.map((rid) => ({ recipient: rid, ...payload }));
    
    // 1. Batch insert into DB
    await Notification.insertMany(docs);
    
    // 2. Bridge to Java MQ
    notifyJavaMQ("notification:broadcast", { count: recipientIds.length, ...payload });

    logger.info(SERVICE, "Broadcast sent (direct)", {
      count: recipientIds.length,
    });
  } catch (err) {
    logger.error(SERVICE, "Broadcast failed", { error: err.message });
  }
};

exports.deleteOldNotifications = async () => {
  try {
    const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000);
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoff },
    });
    if (result.deletedCount > 0)
      logger.info(
        SERVICE,
        `Cleanup: deleted ${result.deletedCount} old notifications`,
      );
  } catch (err) {
    logger.error(SERVICE, "Cleanup failed", { error: err.message });
  }
};
