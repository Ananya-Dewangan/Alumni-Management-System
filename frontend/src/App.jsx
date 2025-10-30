import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProfilePage from "./pages/profile/ProfilePage";
import ViewProfile from "./pages/profile/ViewProfile";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Logout from "./pages/auth/Logout";
import Home from "./pages/post/page";
import AuthPage from "./pages/auth/page";
import MyNetwork from "./pages/myNetwork/myNetwork";
import ChatPage from "./pages/chat/ChatPage";
import NotificationPage from "./pages/chat/NotificationPage";
import EventPage from "./pages/event/EventPage";
import ErrorPage from "./pages/error/ErrorPage";
import SendPostPage from "@/pages/post/SendPostPage";

// ✅ Import your new Admin Data Export page
import AdminDataExport from "./pages/AdminDataExport";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/logout" element={<Logout />} />

        {/* Own profile */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* View others */}
        <Route path="/profile/:id" element={<ViewProfile />} />

        <Route path="/home" element={<Home />} />
        <Route path="/network" element={<MyNetwork />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/event" element={<EventPage />} />
        <Route path="/send-post/:postId" element={<SendPostPage />} />

        {/* ✅ Admin data export page */}
        <Route path="/admin-data-export" element={<AdminDataExport />} />

        {/* Default routes */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<Navigate to="/error" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
