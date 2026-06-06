const Event        = require("../models/Event");
const User         = require("../models/User");
const notifService = require("../services/notificationService");
const eventBus     = require("../utils/eventEmitter");

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy","name").sort({ date: 1 });
    res.json({ success: true, events });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, venue, department } = req.body;
    if (!title || !date)
      return res.status(400).json({ success: false, message: "Title and date required." });

    const event = await Event.create({ title, description, date, venue, department, createdBy: req.user._id });

    const users = await User.find({ isActive: true }).select("_id");
    await notifService.broadcastNotification(users.map(u => u._id), {
      type:    "event",
      title:   "📅 New Event",
      message: `${title}${venue ? ` at ${venue}` : ""}`,
      link:    "/events",
      meta:    { eventId: event._id },
    });

    eventBus.emit(eventBus.EVENTS.EVENT_CREATED, { event });
    res.status(201).json({ success: true, event });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
