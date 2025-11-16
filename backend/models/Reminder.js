// models/Reminder.js
import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // optional, if you want to track which admin created it
  },
}, { timestamps: true });

export default mongoose.model("Reminder", reminderSchema);
