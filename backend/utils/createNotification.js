// utils/createNotification.js
import Notification from "../models/Notification.js";

export const createNotification = async ({ recipient, sender, type, postId = null, text }) => {
  try {
    if (recipient.toString() === sender.toString()) return; // don't notify self

    const newNotif = new Notification({
      recipient,
      sender,
      type,
      postId,
      text,
    });

    await newNotif.save();
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};