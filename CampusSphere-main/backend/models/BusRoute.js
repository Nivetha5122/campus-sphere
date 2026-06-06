const mongoose = require("mongoose");

const busRouteSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  color: { type: String, default: "#5483B3" },
  coordinates: [{ lat: Number, lng: Number }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("BusRoute", busRouteSchema);
