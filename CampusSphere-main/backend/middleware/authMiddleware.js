const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

// ─── VERIFY JWT TOKEN ──────────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated. Contact admin." });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("AuthMiddleware", "Token verification failed", { error: error.message });
    return res.status(401).json({ success: false, message: "Not authorized. Token invalid or expired." });
  }
};

// ─── ROLE-BASED ACCESS CONTROL (RBAC) ─────────────────────────────────────────
// Usage: authorize("admin", "teacher")
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn("RBAC", `Access denied for role: ${req.user.role}`, {
        userId: req.user._id,
        requiredRoles: roles,
        path: req.path,
      });
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

// ─── OWNERSHIP CHECK ───────────────────────────────────────────────────────────
// Allows resource owner OR admin to proceed
exports.ownerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);
      const isOwner = ownerId && ownerId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only modify your own resources.",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Authorization check failed." });
    }
  };
};
