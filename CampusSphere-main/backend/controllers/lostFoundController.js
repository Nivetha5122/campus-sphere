const LostItem = require("../models/LostItem");
const User = require("../models/User");
const notifService = require("../services/notificationService");

exports.createItem = async (req, res) => {
  try {
    const { title, description, location, contactInfo, type: bodyType, status: bodyStatus } = req.body;
    // `type` is the item kind (lost/found); frontend may send it as `status` or `type`
    const itemType = (bodyType || bodyStatus || "lost").toLowerCase();
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "Title required." });

    const item = await LostItem.create({
      title,
      description,
      location,
      contactInfo,
      type: itemType,       // "lost" or "found"
      // status defaults to "open" per schema
      reportedBy: req.user._id,
    });

    // Notify all students about the new item
    const students = await User.find({
      role: "student",
      isActive: true,
    }).select("_id");

    await notifService.broadcastNotification(
      students.map((s) => s._id),
      {
        type: "lost_found",
        title: itemType === "found" ? "🔍 Found Item Reported" : "❓ New Lost Item",
        message: `"${title}" was reported as ${itemType}${location ? ` at ${location}` : ""}.`,
        link: "/lost-found",
        meta: { itemId: item._id },
      },
    );

    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const items = await LostItem.find()
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await LostItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!item)
      return res.status(404).json({ success: false, message: "Not found." });

    if (req.body.status === "claimed") {
      await notifService.createNotification({
        recipient: item.reportedBy,
        type: "lost_found",
        title: "✅ Item Claimed",
        message: `"${item.title}" has been marked as claimed.`,
        link: "/lost-found",
        meta: { itemId: item._id },
      });
    }
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.claimItem = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item)
      return res.status(404).json({ success: false, message: "Not found." });

    item.status = "claimed";
    item.claimedBy = req.user._id;
    await item.save();

    await notifService.createNotification({
      recipient: item.reportedBy,
      type: "lost_found",
      title: "✅ Item Claimed",
      message: `"${item.title}" has been marked as claimed.`,
      link: "/lost-found",
      meta: { itemId: item._id },
    });

    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.closeItem = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item)
      return res.status(404).json({ success: false, message: "Not found." });

    item.status = "closed";
    await item.save();

    await notifService.createNotification({
      recipient: item.reportedBy,
      type: "lost_found",
      title: "🔒 Item Closed",
      message: `"${item.title}" has been closed in Lost & Found.`,
      link: "/lost-found",
      meta: { itemId: item._id },
    });

    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
