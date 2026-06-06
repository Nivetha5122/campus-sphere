const mongoose = require("mongoose");

const campusLocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true }, // e.g. "TT", "SJT"
  category: { type: String, enum: ["academic", "hostel", "admin", "lab", "sports", "medical", "food", "other"], required: true },
  description: { type: String },
  floor: { type: String },
  capacity: { type: Number },
  facilities: [String],
  timings: { type: String, default: "9:00 AM – 5:00 PM" },
  isActive: { type: Boolean, default: true },
  // SVG grid position for the map
  gridX: { type: Number },
  gridY: { type: Number },
}, { timestamps: true });

campusLocationSchema.index({ category: 1 });

module.exports = mongoose.model("CampusLocation", campusLocationSchema);
