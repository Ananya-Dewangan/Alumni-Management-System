import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipient,
  sender,
  type,
  postId = null,
  text,
  io = null,
}) => {
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

    // 🔹 Emit real-time notification if io available
    if (io) {
      io.to(recipient.toString()).emit("newNotification", { message: text });
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};