const router = require("express").Router();
const ctrl   = require("../controllers/examController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/my-marks",               protect,                           ctrl.getMyMarks);
router.get("/",                        protect, authorize("admin","teacher"), ctrl.getExams);
router.post("/",                       protect, authorize("admin","teacher"), ctrl.createExam);
router.get("/:id",                     protect,                           ctrl.getExamDetail);
router.delete("/:id",                  protect, authorize("admin","teacher"), ctrl.deleteExam);
router.post("/:id/sections",           protect, authorize("admin","teacher"), ctrl.addSection);
router.patch("/:id/sections/:sectionId", protect, authorize("admin","teacher"), ctrl.updateMarks);
router.delete("/:id/sections/:sectionId", protect, authorize("admin","teacher"), ctrl.deleteSection);

module.exports = router;
