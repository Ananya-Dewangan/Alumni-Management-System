import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import { connectDB } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import chatRoutes from "./routes/chatRoutes.js"; // <-- new chat routes
import eventRoutes from "./routes/eventRoutes.js"
import path from "path";
import { fileURLToPath } from "url";
import Message from "./models/Message.js";
import Notification from "./models/Notification.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true }
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/events", eventRoutes);

// Real-time chat logic
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // User joins their personal room (for notifications)
  socket.on("join_user", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  // User joins a chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on("send_message", async (data) => {
    const { chatId, senderId, senderName, text, recipientId } = data;

    if (!chatId || !senderId || !recipientId) {
      console.error("❌ Missing required fields in send_message");
      return;
    }

    const message = {
      chatId,
      sender: senderId,
      text,
      createdAt: new Date(),
    };

    // Save the message in DB
    await Message.create({
      chat: chatId,
      sender: senderId,
      text,
    });

    // Broadcast message to chat participants
    io.to(chatId).emit("receive_message", message);

    // Save notification for recipient
    const notif = new Notification({
      recipient: recipientId,
      sender: senderId,
      chatId,
      text,
    });
    console.log(notif);
    await notif.save();

    // Emit real-time notification to recipient's personal room
    io.to(recipientId).emit("notification", {
      chatId,
      senderId,
      senderName,
      text,
    });

    //  When you create a notification
    io.to(recipientId.toString()).emit("newNotification", {
      message: "You have a new notification",
    });


    console.log(`📩 Message from ${senderId} to ${recipientId} saved & notified`);
  });
});



// Use server.listen for Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
