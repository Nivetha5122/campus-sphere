// backend/models/LostItem.js

const mongoose = require("mongoose");

const lostItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    category: {
      type: String,
      default: "general",
    },

    location: {
      type: String,
      required: [true, "Location is required"],
    },

    date: {
      type: Date,
      default: Date.now,
    },

    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "claimed", "closed"],
      default: "open",
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LostItem", lostItemSchema);