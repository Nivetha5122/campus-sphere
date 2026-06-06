const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
  updateUserRole,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");
const rateLimiter = require("../utils/rateLimiter");

// Auth routes with strict rate limiting
router.post("/register", rateLimiter(20, 60000), registerUser);
router.post("/login",    rateLimiter(10, 60000), loginUser);

// Protected routes
router.get("/me", protect, getMe);

// Admin-only user management
router.get("/users",         protect, authorize("admin"), getAllUsers);
router.patch("/users/:id",   protect, authorize("admin"), updateUserRole);

module.exports = router;
