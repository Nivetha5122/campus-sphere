const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    type: {
      type: String,
      enum: ["notes", "syllabus", "reference"],
      default: "notes",
    },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "ready",
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Note", noteSchema);
