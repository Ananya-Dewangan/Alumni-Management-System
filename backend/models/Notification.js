// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who receives it
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },    // who sends it
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Notification", notificationSchema);
