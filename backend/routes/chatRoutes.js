import express from "express";
import Chat from "../models/chat.js";
import Message from "../models/Message.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Start or get a chat
router.post("/start/:alumniId", authMiddleware, async (req, res) => {
  try {
    const { alumniId } = req.params;
    const userId = req.user._id;

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [userId, alumniId] }
    });

    console.log(chat);


    if (!chat) {
      chat = await Chat.create({ participants: [userId, alumniId] });
    }

    const messages = await Message.find({ chat: chat._id }).populate("sender", "username role");
    res.json({ ...chat.toObject(), messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get chat by chatId (with messages)
router.get("/:chatId", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate("participants", "username role");
    if (!chat) return res.status(404).json({ msg: "Chat not found" });

    const messages = await Message.find({ chat: chat._id })
      .populate("sender", "username role");

    res.json({ ...chat.toObject(), messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get messages of a chat
router.get("/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username role");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
