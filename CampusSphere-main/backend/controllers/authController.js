const User = require("../models/User");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const eventBus = require("../utils/eventEmitter");

const SERVICE = "AuthService";

// ─── GENERATE JWT ──────────────────────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ─── REGISTER ──────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, studentId, employeeId, designation } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required." });
    }

    // Prevent self-assignment of admin role
    const allowedRoles = ["student", "teacher"];
    const assignedRole = allowedRoles.includes(role) ? role : "student";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "A user with this email already exists." });
    }

    const userData = { name, email, password, role: assignedRole };

    if (assignedRole === "student") {
      userData.studentId = studentId;
      userData.department = department;
    }
    if (assignedRole === "teacher") {
      userData.employeeId = employeeId;
      userData.designation = designation;
      userData.department = department;
    }

    const user = await User.create(userData);
    const token = generateToken(user);

    // Fire internal event
    eventBus.emit(eventBus.EVENTS.USER_REGISTERED, { userId: user._id, role: user.role });

    logger.info(SERVICE, "New user registered", { userId: user._id, role: user.role });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    logger.error(SERVICE, "Registration failed", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Your account has been deactivated." });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user);

    eventBus.emit(eventBus.EVENTS.USER_LOGIN, { userId: user._id, role: user.role });

    logger.info(SERVICE, "User logged in", { userId: user._id, role: user.role });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    logger.error(SERVICE, "Login failed", { error: error.message });
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET CURRENT USER (ME) ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── ADMIN: GET ALL USERS ─────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { role, department, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (search) filter.name = { $regex: search, $options: "i" };

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => u.toSafeObject()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── ADMIN: UPDATE USER ROLE ──────────────────────────────────────────────────
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const allowedRoles = ["student", "teacher", "admin"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    logger.info(SERVICE, "User role/status updated", {
      targetUserId: id,
      updatedBy: req.user._id,
      changes: updateData,
    });

    res.status(200).json({ success: true, message: "User updated.", user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};
