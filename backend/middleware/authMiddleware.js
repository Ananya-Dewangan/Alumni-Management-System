import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔹 Regular Authentication Middleware
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: "No auth token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ msg: "Token verification failed" });

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ msg: "Server error in auth middleware" });
  }
};

// 🔹 Admin Authentication Middleware
export const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: "No auth token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ msg: "Token verification failed" });

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.role !== "admin")
      return res.status(403).json({ msg: "Access denied: Admins only" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Admin Auth Middleware Error:", err);
    res.status(500).json({ msg: "Server error in admin auth middleware" });
  }
};
