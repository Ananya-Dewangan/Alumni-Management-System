import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authMiddleware }from "../middleware/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { username, email, password, batch, role } = req.body;
  try {
    if (await User.findOne({ email }))
      return res.status(400).json({ msg: "Email already exists" });
    if (await User.findOne({ username }))
      return res.status(400).json({ msg: "Username already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashed,
      graduation_year: batch,
      role,
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });

    const { password: pw, ...userData } = newUser._doc;
    res.status(200).json({ msg: "Registration successful", user: userData });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });

    const { password: pw, ...userData } = user._doc;
    res.json({ msg: "Login successful", user: userData });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ msg: "Logged out successfully" });
});

// Get current logged-in user
router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

// Get a user's public profile by ID (no auth required)
router.get("/profile/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId || userId === "undefined") {
      return res.status(400).json({ message: "Invalid or missing user ID" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;