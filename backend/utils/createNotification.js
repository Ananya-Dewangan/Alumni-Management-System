// utils/createNotification.js
import Notification from "../models/Notification.js";

/**
 * Helper to generate redirect link based on notification type
 */
const generateNotificationLink = (type, { postId, sender, chatId, eventId }) => {
  switch (type) {
    case "post": // new post created
      return `/post/${postId}`;
    case "like": // post liked
    case "comment": // comment added
    case "reply": // reply added
    case "repost": // post reposted
    case "send_post": // post shared via DM
      return `/post/${postId}`;
    case "follow": // someone followed you
      return `/profile/${sender}`;
    case "chat": // direct chat message
      return `/messages/${chatId || sender}`;
    case "event": // event-related notification
      return `/event/${eventId}`;
    default:
      return "/";
  }
};

/**
 * Create a new notification and optionally emit via Socket.IO
 */
export const createNotification = async ({
  recipient,
  sender,
  type,
  postId = null,
  chatId = null,
  eventId = null,
  text,
  io = null,
}) => {
  try {
    if (recipient.toString() === sender.toString()) return; // Don't notify self

    // ✅ Auto-generate link for the notification
    const link = generateNotificationLink(type, { postId, sender, chatId, eventId });

    const newNotif = new Notification({
      recipient,
      sender,
      type,
      postId,
      chatId,
      eventId,
      text,
      link, // ✅ save redirect path
    });

    await newNotif.save();

    // ✅ Emit real-time notification if socket.io instance available
    if (io) {
      io.to(recipient.toString()).emit("newNotification", {
        message: text,
        type,
        link,
      });
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
