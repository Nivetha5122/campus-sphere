const express = require("express");
const router = express.Router();
const {
  createAnnouncement,
  getAllAnnouncements,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/",    protect, getAllAnnouncements);
router.post("/",   protect, authorize("admin", "teacher"), createAnnouncement);
router.delete("/:id", protect, authorize("admin"), deleteAnnouncement);

module.exports = router;
