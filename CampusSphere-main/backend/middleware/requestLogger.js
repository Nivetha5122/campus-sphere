const logger = require("../utils/logger");

// Logs every incoming request with method, path, user, duration
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const userId = req.user?._id || "anonymous";
    const userRole = req.user?.role || "none";

    logger.info("HTTP", `${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      userId,
      userRole,
      ip: req.ip,
    });
  });

  next();
};

module.exports = requestLogger;
