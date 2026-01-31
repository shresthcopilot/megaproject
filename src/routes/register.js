// routes/register.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // basic validation
    if (!username || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 5) {
      return res.status(400).json({ error: "Password too short" });
    }

    // check duplicate user
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      username,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: "User registered successfully",
      user: user.username
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
