// backend/models/Booking.js

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    facility: {
      type: String,
      required: [true, "Facility is required"], // e.g., "Lab A", "Room 101"
    },

    date: {
      type: Date,
      required: [true, "Date is required"],
    },

    startTime: {
      type: String, // "10:00"
      required: [true, "Start time is required"],
    },

    endTime: {
      type: String, // "11:00"
      required: [true, "End time is required"],
    },

    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    purpose: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);