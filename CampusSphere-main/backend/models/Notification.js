const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["complaint","booking","event","announcement","marks","lost_found","system"],
    default: "system",
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  isRead:  { type: Boolean, default: false },
  link:    { type: String },
  meta:    { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
// MongoDB TTL index — auto-deletes documents 36 hours after createdAt
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 129600 });

module.exports = mongoose.model("Notification", notificationSchema);
