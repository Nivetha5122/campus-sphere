const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/notificationController");

router.get("/",              protect, ctrl.getMyNotifications);
router.patch("/read-all",    protect, ctrl.markAllRead);
router.patch("/:id/read",    protect, ctrl.markAsRead);
router.delete("/:id",        protect, ctrl.deleteNotification);

module.exports = router;
