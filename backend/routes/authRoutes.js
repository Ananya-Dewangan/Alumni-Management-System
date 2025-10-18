import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { username, email, password, batch, role } = req.body;
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ msg: "Email already exists" });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ msg: "Username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashed, graduation_year:batch, role });
    await newUser.save();

    // 🔑 Generate JWT token
    const token = jwt.sign(
      { id: newUser._id},
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 🍪 Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // change to true in production with HTTPS
      sameSite: "lax"
    });
    
    res.status(200).json({ msg: "Registration successful" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ msg: err.message });
  }
});


// Login
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // change to true in production with HTTPS
      sameSite: "lax"
    });

    res.json({ msg: "Login successful", user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ msg: "Logged out successfully" });
});


router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user); // { _id: "...", email: "...", etc. }
});



export default router;
