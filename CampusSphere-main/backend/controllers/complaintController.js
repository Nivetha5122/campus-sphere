const Complaint    = require("../models/Complaint");
const User         = require("../models/User");
const notifService = require("../services/notificationService");
const eventBus     = require("../utils/eventEmitter");

exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    if (!title || !description || !location)
      return res.status(400).json({ success: false, message: "Title, description and location are required." });

    const complaint = await Complaint.create({ title, description, category, location, createdBy: req.user._id });

    // Notify all admins
    const admins = await User.find({ role: "admin", isActive: true }).select("_id");
    await notifService.broadcastNotification(admins.map(a => a._id), {
      type:    "complaint",
      title:   "🔔 New Complaint Filed",
      message: `"${title}" by ${req.user.name}`,
      link:    "/complaints",
      meta:    { complaintId: complaint._id },
    });

    eventBus.emit(eventBus.EVENTS.COMPLAINT_CREATED, { complaint, user: req.user });
    res.status(201).json({ success: true, complaint });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "student") filter.createdBy = req.user._id;
    const complaints = await Complaint.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: complaints.length, complaints });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending","in-progress","resolved"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status." });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Not found." });

    complaint.status = status;
    if (status === "in-progress") complaint.assignedTo = req.user._id;
    await complaint.save();

    const msgs = {
      "in-progress": "Your complaint is being reviewed.",
      "resolved":    "Your complaint has been resolved. ✓",
    };
    if (msgs[status]) {
      await notifService.createNotification({
        recipient: complaint.createdBy,
        type:      "complaint",
        title:     status === "resolved" ? "✅ Complaint Resolved" : "🔄 Complaint In Progress",
        message:   `"${complaint.title}" — ${msgs[status]}`,
        link:      "/complaints",
        meta:      { complaintId: complaint._id },
      });
    }

    eventBus.emit(eventBus.EVENTS.COMPLAINT_UPDATED, { complaint, updatedBy: req.user });
    res.json({ success: true, complaint });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
