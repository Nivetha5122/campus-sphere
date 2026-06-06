const Exam = require("../models/Exam");
const User = require("../models/User");
const notifService = require("../services/notificationService");

// Get all exams (teacher sees own, admin sees all)
exports.getExams = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { createdBy: req.user._id };
    const exams = await Exam.find(filter)
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 });
    res.json({ success: true, exams });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Create exam record
exports.createExam = async (req, res) => {
  try {
    const { subject, department } = req.body;
    if (!subject)
      return res
        .status(400)
        .json({ success: false, message: "Subject required" });

    // For non-admin users (teachers), force the exam department to the teacher's department
    // Admins may still specify a department via the request body
    let dept = department;
    if (req.user.role !== "admin") {
      dept = req.user.department;
    }
    if (!dept)
      return res
        .status(400)
        .json({ success: false, message: "Department required" });

    const exam = await Exam.create({
      subject,
      department: dept,
      createdBy: req.user._id,
      sections: [],
    });
    res.status(201).json({ success: true, exam });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Add section — auto-populates marks for all students in department from DB
exports.addSection = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam)
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });

    const { title, maxScore } = req.body;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "Section title required" });

    // Fetch all active students in this department from the database
    const students = await User.find({
      role: "student",
      department: exam.department,
      isActive: true,
    }).select("_id");

    const marks = students.map((s) => ({
      student: s._id,
      score: 0,
      maxScore: maxScore || 100,
      remarks: "",
    }));

    exam.sections.push({ title, maxScore: maxScore || 100, marks });
    await exam.save();
    res.json({ success: true, exam });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Update marks for a section + notify each student whose score changed
exports.updateMarks = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam)
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });

    const section = exam.sections.id(req.params.sectionId);
    if (!section)
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });

    for (const { studentId, score, remarks } of req.body.marks || []) {
      const entry = section.marks.find(
        (m) => m.student.toString() === studentId,
      );
      if (!entry) continue;

      const oldScore = entry.score;
      entry.score = score !== undefined ? score : entry.score;
      entry.remarks = remarks !== undefined ? remarks : entry.remarks;

      // Only notify if score actually changed
      if (score !== undefined && score !== oldScore) {
        await notifService.createNotification({
          recipient: studentId,
          type: "marks",
          title: "📊 Marks Updated",
          message: `Your score for ${exam.subject} — ${section.title}: ${score}/${section.maxScore}${remarks ? ` (${remarks})` : ""}`,
          link: "/marks",
          meta: {
            examId: exam._id,
            sectionId: section._id,
            score,
            maxScore: section.maxScore,
          },
        });
      }
    }

    await exam.save();
    res.json({ success: true, exam });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get exam detail with populated student info
exports.getExamDetail = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate(
      "sections.marks.student",
      "name studentId department",
    );
    if (!exam)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, exam });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Delete a section
exports.deleteSection = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam)
      return res.status(404).json({ success: false, message: "Not found" });
    exam.sections = exam.sections.filter(
      (s) => s._id.toString() !== req.params.sectionId,
    );
    await exam.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Delete exam
exports.deleteExam = async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Student: get own marks across all exams in their department
exports.getMyMarks = async (req, res) => {
  try {
    const exams = await Exam.find({ department: req.user.department }).populate(
      "createdBy",
      "name",
    );

    const result = exams.map((exam) => ({
      _id: exam._id,
      subject: exam.subject,
      teacher: exam.createdBy?.name,
      sections: exam.sections.map((sec) => {
        const entry = sec.marks.find(
          (m) => m.student?.toString() === req.user._id.toString(),
        );
        return {
          _id: sec._id,
          title: sec.title,
          maxScore: sec.maxScore,
          score: entry?.score ?? null,
          remarks: entry?.remarks ?? "",
        };
      }),
    }));

    res.json({ success: true, exams: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
