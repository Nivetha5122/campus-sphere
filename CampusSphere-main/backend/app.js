const express = require("express");
const cors    = require("cors");
const path    = require("path");
const requestLogger = require("./middleware/requestLogger");
const rateLimiter   = require("./utils/rateLimiter");
const logger        = require("./utils/logger");

const app = express();
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow curl / server-to-server
    if (
      ALLOWED_ORIGINS.some((o) => origin.startsWith(o)) ||
      origin.endsWith(".railway.app") ||
      origin.endsWith(".vercel.app")
    ) return cb(null, true);
    cb(new Error("CORS: origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(requestLogger);
app.use(rateLimiter(100, 60000));

app.get("/ping", (req, res) => {
  res.send("Node alive");
  eventEmitter.emit("ping");
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.json({ status:"ok", service:"CampusSphere API v2" }));
app.get("/api/v1/health", (req, res) => res.json({ status:"ok", timestamp:new Date().toISOString() }));

app.use("/api/v1/auth",          require("./routes/authRoutes"));
app.use("/api/v1/complaints",    require("./routes/complaintRoutes"));
app.use("/api/v1/events",        require("./routes/eventRoutes"));
app.use("/api/v1/announcements", require("./routes/announcementRoutes"));
app.use("/api/v1/bookings",      require("./routes/bookingRoutes"));
app.use("/api/v1/lost-found",    require("./routes/lostFoundRoutes"));
app.use("/api/v1/notifications", require("./routes/notificationRoutes"));
app.use("/api/v1/campus-map",    require("./routes/campusMapRoutes"));
app.use("/api/v1/bus-routes",    require("./routes/busRoutes"));
app.use("/api/v1/notes",         require("./routes/notesRoutes"));
app.use("/api/v1/exams",         require("./routes/examRoutes"));
app.use("/api/v1/admin",         require("./routes/adminRoutes"));
app.use("/api.v1/uploads", express.static("uploads"));

app.use((req, res) => res.status(404).json({ success:false, message:`Route ${req.originalUrl} not found.` }));
app.use((err, req, res, next) => {
  logger.error("GlobalError", err.message, { stack:err.stack });
  res.status(err.status||500).json({ success:false, message:err.message||"Internal server error." });
});

module.exports = app;
