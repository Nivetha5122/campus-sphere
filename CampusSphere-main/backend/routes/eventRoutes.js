const express = require("express");
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  deleteEvent,
} = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/",    protect, getAllEvents);
router.post("/",   protect, authorize("admin", "teacher"), createEvent);
router.delete("/:id", protect, authorize("admin"), deleteEvent);

module.exports = router;
