// backend/routes/bookingRoutes.js

const express = require("express");
const router = express.Router();

const {
  createBooking,
  getBookings,
  cancelBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");

// 📝 CREATE BOOKING (protected)
router.post("/", protect, createBooking);

// 📋 GET BOOKINGS (protected)
router.get("/", protect, getBookings);

// ❌ CANCEL BOOKING (protected)
router.delete("/:id", protect, cancelBooking);

module.exports = router;