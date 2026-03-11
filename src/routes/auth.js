import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const saltRounds = 10;

/* -------------------- ASYNC HANDLER -------------------- */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* -------------------- REGISTER -------------------- */
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role)
      return res
        .status(400)
        .json({ error: "username, password and role are required" });

    const existing = await User.findOne({ username, role });
    if (existing)
      return res
        .status(409)
        .json({ error: "User already exists for the given role" });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await User.create({
      username,
      password: hashedPassword,
      role,
    });

    res.json({ message: "User registered successfully" });
  })
);

/* -------------------- LOGIN -------------------- */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role)
      return res
        .status(400)
        .json({ error: "username, password and role are required" });

    const user = await User.findOne({ username, role });
    if (!user)
      return res.status(404).json({ error: "User not found" });

    let isMatch = false;

    if (user.password?.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else if (user.password === password) {
      // Migrate plaintext → hashed
      user.password = await bcrypt.hash(password, saltRounds);
      await user.save();
      isMatch = true;
    }

    if (!isMatch)
      return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: user.username,
    });
  })
);

/* -------------------- GET ALL USERS -------------------- */
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.find({}, { password: 0 });

    res.json({
      success: true,
      data: users || [],
      message:
        users.length === 0
          ? "No users found"
          : "Users fetched successfully",
    });
  })
);

/* -------------------- GET USER BY ID -------------------- */
router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id, {
      password: 0,
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "User not found" });

    res.json({ success: true, data: user });
  })
);

/* -------------------- UPDATE USER -------------------- */
router.put(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { username, role, password } = req.body;
    const userId = req.params.id;

    if (!username || !role)
      return res
        .status(400)
        .json({ success: false, error: "Username and role are required" });

    const existing = await User.findOne({
      username,
      role,
      _id: { $ne: userId },
    });

    if (existing)
      return res.status(409).json({
        success: false,
        error: "User already exists with this username and role",
      });

    const updateData = {
      username,
      role: role.toLowerCase(),
    };

    if (password)
      updateData.password = await bcrypt.hash(password, saltRounds);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  })
);

/* -------------------- DELETE USER -------------------- */
router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "User not found" });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  })
);

/* -------------------- EXPORTS -------------------- */
export { authMiddleware } from "../middleware/jwt-middleware.js";
export default router;