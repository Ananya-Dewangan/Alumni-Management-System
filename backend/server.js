// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sendPostRoutes from "./routes/sendPostRoutes.js";
import Message from "./models/Message.js";
import Notification from "./models/Notification.js";
import emailChangeRoutes from './routes/emailChangeRoutes.js';
import remindersRoutes from './routes/reminders.js'; 
import donationRoutes from "./routes/donationRoutes.js";
// import paymentRoutes from "./routes/paymentRoutes.js";
import mentorRoutes from "./routes/mentor.js"; 


dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const server = http.createServer(app);

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

app.set("io", io);

// ✅ Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("🚀 CampusSetu Backend is Running Successfully!");
});

// ✅ Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/send-post", sendPostRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/email-change-requests', emailChangeRoutes);
app.use("/api/reminders", remindersRoutes);  
app.use("/api/donation", donationRoutes);
// app.use("/api/payment", paymentRoutes);
app.use("/uploads", express.static("uploads")); 
app.use("/api/mentors", mentorRoutes);


// ✅ Socket.IO Events
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join_user", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their personal room`);
  });

  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`💬 Socket ${socket.id} joined chat room ${chatId}`);
  });

  // 💬 Chat message handling
  socket.on("send_message", async (data) => {
    try {
      const { chatId, senderId, senderName, text, recipientId } = data;
      if (!chatId || !senderId || !recipientId) {
        console.error("❌ Missing required fields in send_message");
        return;
      }

      const savedMessage = await Message.create({
        chat: chatId,
        sender: senderId,
        text,
      });

      io.to(chatId).emit("receive_message", {
        chatId,
        senderId,
        senderName,
        text,
        createdAt: savedMessage.createdAt,
      });

      const notif = new Notification({
        recipient: recipientId,
        sender: senderId,
        chatId,
        text: `💬 New message from ${senderName}`,
        type: "chat",
      });
      await notif.save();

      io.to(recipientId.toString()).emit("notification", {
        chatId,
        senderId,
        senderName,
        text: notif.text,
        type: "chat",
      });

      console.log(`📩 Message ${senderId} → ${recipientId} saved & notified`);
    } catch (err) {
      console.error("💥 Error in send_message:", err);
    }
  });

  // 📢 Broadcast event notifications to all users
  socket.on("broadcast_event", async (data) => {
    try {
      const { title, description, creatorName } = data;

      const notif = new Notification({
        recipient: "all",
        sender: creatorName,
        type: "event",
        text: `${creatorName} created a new event: ${title}`,
      });

      await notif.save();

      io.emit("event_notification", {
        title,
        description,
        creatorName,
        message: `📢 New event: ${title} by ${creatorName}`,
      });

      console.log(`📣 Event notification broadcasted for ${title}`);
    } catch (err) {
      console.error("💥 Error in broadcast_event:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
