const Booking = require("../models/Booking");
const notifService = require("../services/notificationService");

exports.createBooking = async (req, res) => {
  try {
    // accept `facility` (new) or `venue` (legacy frontend)
    const {
      facility: bodyFacility,
      venue,
      date,
      startTime,
      endTime,
      purpose,
    } = req.body;
    const facility = (bodyFacility || venue || "").trim();
    if (!facility || !date || !startTime || !endTime)
      return res.status(400).json({
        success: false,
        message: "Facility, date, startTime and endTime are required.",
      });

    // Prevent past date/time bookings
    const bookingDateTime = new Date(`${date}T${startTime}`);
    const now = new Date();
    if (bookingDateTime < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot book a room for a past date or time.",
      });
    }

    const booking = await Booking.create({
      facility,
      date,
      startTime,
      endTime,
      purpose,
      bookedBy: req.user._id,
    });

    // Fire notification async — don't await so gateway timeout is never triggered
    notifService.createNotification({
      recipient: req.user._id,
      type: "booking",
      title: "✅ Booking Confirmed",
      message: `${facility} booked for ${new Date(date).toLocaleDateString("en-IN")} at ${startTime}.`,
      link: "/booking",
      meta: { bookingId: booking._id },
    }).catch(() => {});

    const bookingObj = booking.toObject ? booking.toObject() : booking;
    bookingObj.venue = bookingObj.facility || bookingObj.venue;
    res.status(201).json({ success: true, booking: bookingObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const filter =
      req.user.role === "student" ? { bookedBy: req.user._id } : {};
    const bookings = await Booking.find(filter)
      .populate("bookedBy", "name email")
      .sort({ createdAt: -1 });
    // keep `venue` alias for frontend compatibility
    const result = bookings.map((b) => {
      const obj = b.toObject ? b.toObject() : b;
      obj.venue = obj.facility || obj.venue;
      return obj;
    });
    res.json({ success: true, bookings: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ success: false, message: "Not found." });

    await notifService.createNotification({
      recipient: booking.bookedBy,
      type: "booking",
      title: "❌ Booking Cancelled",
      message: `Your booking for ${booking.facility || booking.venue} has been cancelled.`,
      link: "/booking",
    });

    await booking.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
