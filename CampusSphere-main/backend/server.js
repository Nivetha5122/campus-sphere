const app = require("./app");
require("./queues");
const mongoose = require("mongoose");
const { deleteOldNotifications } = require("./services/notificationService");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () =>
      console.log(`API Server → http://localhost:${PORT}`),
    );

    // Cleanup old notifications every hour (belt+suspenders alongside MongoDB TTL index)
    setInterval(deleteOldNotifications, 60 * 60 * 1000);
    deleteOldNotifications();
    // Start background workers (queues)
    try {
      require("./queues/notesWorker");
      require("./queues/notificationsWorker");
      console.log("Background workers started");
    } catch (err) {
      console.error("Failed to start workers:", err.message || err);
    }
  })
  .catch((err) => {
    console.error("DB Connection Error:", err.message);
    process.exit(1);
  });
