import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: "No auth token" });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ msg: "Token verification failed" });

    // Fetch user from DB and attach to req
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    req.user = user; // Attach full user
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ msg: "Server error in auth middleware" });
  }
};