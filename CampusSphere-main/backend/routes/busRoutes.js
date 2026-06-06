const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");

// Static route data (also stored in frontend for simulation)
const ROUTES = [
  { id:"R1", name:"Route 1 — Main Gate Loop", color:"#5483B3",
    coordinates:[{lat:12.9698,lng:79.1559},{lat:12.9710,lng:79.1570},{lat:12.9720,lng:79.1560},{lat:12.9715,lng:79.1545},{lat:12.9705,lng:79.1535},{lat:12.9695,lng:79.1540},{lat:12.9688,lng:79.1552},{lat:12.9690,lng:79.1565},{lat:12.9698,lng:79.1559}] },
  { id:"R2", name:"Route 2 — Hostel Circuit", color:"#7DA0CA",
    coordinates:[{lat:12.9698,lng:79.1559},{lat:12.9685,lng:79.1565},{lat:12.9675,lng:79.1558},{lat:12.9672,lng:79.1545},{lat:12.9680,lng:79.1535},{lat:12.9690,lng:79.1530},{lat:12.9700,lng:79.1538},{lat:12.9705,lng:79.1550},{lat:12.9698,lng:79.1559}] },
  { id:"R3", name:"Route 3 — Academic Block", color:"#C1E8FF",
    coordinates:[{lat:12.9698,lng:79.1559},{lat:12.9708,lng:79.1548},{lat:12.9718,lng:79.1540},{lat:12.9725,lng:79.1550},{lat:12.9720,lng:79.1565},{lat:12.9710,lng:79.1570},{lat:12.9700,lng:79.1572},{lat:12.9695,lng:79.1563},{lat:12.9698,lng:79.1559}] },
];

router.get("/", protect, (req, res) => res.json({ success: true, routes: ROUTES }));
module.exports = router;
