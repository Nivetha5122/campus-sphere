const express = require("express");
const router = express.Router();
const {
  createComplaint,
  getAllComplaints,
  updateComplaintStatus,
} = require("../controllers/complaintController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/",          protect, createComplaint);
router.get("/",           protect, getAllComplaints);
router.patch("/:id/status", protect, authorize("admin"), updateComplaintStatus);

module.exports = router;
