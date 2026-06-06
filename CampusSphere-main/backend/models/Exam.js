const mongoose = require("mongoose");

// A mark entry: one student, one exam section
const markEntrySchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score:    { type: Number, default: 0 },
  maxScore: { type: Number, default: 100 },
  remarks:  { type: String, default: "" },
}, { _id: false });

// An exam section (e.g. "Mid Sem 1", "Assignment 2")
const examSectionSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  maxScore: { type: Number, default: 100 },
  marks:    [markEntrySchema],
}, { timestamps: true });

// One exam record per subject per teacher
const examSchema = new mongoose.Schema({
  subject:     { type: String, required: true },
  department:  { type: String, required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sections:    [examSectionSchema],
}, { timestamps: true });

examSchema.index({ createdBy: 1 });
examSchema.index({ department: 1 });

module.exports = mongoose.model("Exam", examSchema);
