const User         = require("../models/User");
const Complaint    = require("../models/Complaint");
const Event        = require("../models/Event");
const Announcement = require("../models/Announcement");
const Booking      = require("../models/Booking");
const LostItem     = require("../models/LostItem");
const Exam         = require("../models/Exam");

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, students, teachers, admins,
      complaints, openComplaints,
      events, announcements, bookings, lostItems, exams,
      recentUsers, recentComplaints,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role:"student" }),
      User.countDocuments({ role:"teacher" }),
      User.countDocuments({ role:"admin" }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status:{ $ne:"resolved" } }),
      Event.countDocuments(),
      Announcement.countDocuments(),
      Booking.countDocuments(),
      LostItem.countDocuments(),
      Exam.countDocuments(),
      User.find().sort({ createdAt:-1 }).limit(5).select("name email role createdAt department"),
      Complaint.find().sort({ createdAt:-1 }).limit(5).populate("createdBy","name").select("title status createdAt category"),
    ]);

    // Users by dept
    const deptGroups = await User.aggregate([
      { $match:{ role:"student" } },
      { $group:{ _id:"$department", count:{ $sum:1 } } },
      { $sort:{ count:-1 } },
      { $limit:8 },
    ]);

    res.json({
      success:true,
      stats:{
        totalUsers, students, teachers, admins,
        complaints, openComplaints,
        events, announcements, bookings, lostItems, exams,
      },
      recentUsers,
      recentComplaints,
      deptGroups,
    });
  } catch(e) {
    res.status(500).json({ success:false, message:e.message });
  }
};
