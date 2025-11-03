// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // who receives it

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // who triggers the notification

  type: {
    type: String,
    enum: ["follow", "post", "like", "comment", "reply", "chat", "event", "repost", "send_post"],
    required: true,
  }, // type of notification

  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },

  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
  },

  text: { type: String, required: true },
  link: { type: String, default: "/" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },

});

export default mongoose.model("Notification", notificationSchema);