const router = require("express").Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/campusMapController");

router.get("/",          protect, ctrl.getLocations);
router.post("/seed",     protect, authorize("admin"), ctrl.seedLocations);
router.post("/",         protect, authorize("admin"), ctrl.createLocation);
router.patch("/:id",     protect, authorize("admin"), ctrl.updateLocation);

module.exports = router;
