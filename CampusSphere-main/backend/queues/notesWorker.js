const path = require("path");
const fs = require("fs");
const Note = require("../models/Note");
const logger = require("../utils/logger");
const { notesQueue } = require("./index");

const SERVICE = "notesWorker";

// Process jobs added to the notes queue
notesQueue.process(async (job, done) => {
  try {
    const { noteId, filePath } = job.data;
    if (!noteId) throw new Error("Missing noteId in job");

    const note = await Note.findById(noteId);
    if (!note) throw new Error(`Note not found: ${noteId}`);

    // Ensure the file exists
    const fullPath =
      filePath || path.join(__dirname, "..", "uploads", note.filename);
    if (!fs.existsSync(fullPath)) {
      note.status = "failed";
      await note.save();
      throw new Error("Uploaded file missing at processing time");
    }

    // Potential place to run additional processing (virus scan, thumbnail, text extraction)
    // For now, mark note as ready
    note.status = "ready";
    await note.save();

    logger.info(SERVICE, "Processed note", { noteId });
    done();
  } catch (err) {
    logger.error(SERVICE, "Job failed", { error: err.message, job: job.id });
    done(err);
  }
});

module.exports = notesQueue;
