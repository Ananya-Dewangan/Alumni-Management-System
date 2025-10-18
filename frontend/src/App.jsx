import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Logout from "./pages/auth/Logout"
import Profile from "./pages/profile/ProfilePage";
import Home from "./pages/post/page"
import AuthPage from "./pages/auth/page";
import { Navigate } from "react-router-dom";
import MyNetwork from "./pages/myNetwork/myNetwork";
import ChatPage from "./pages/chat/ChatPage";
import NotificationPage from "./pages/chat/NotificationPage";
import ChatPageWrapper from "./pages/chat/ChatPageWrapper";
import EventPage from "./pages/event/EventPage";
import ErrorPage from "./pages/error/ErrorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/home" element={<Home />} />
        <Route path="/network" element={<MyNetwork />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/event" element={<EventPage/>} />
        {/* <Route path="/chat/:userId" element={<ChatPageWrapper />} /> */}
        {/* <Route path="/chat/:chatId" element={<ChatPage />} /> */}

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<Navigate to="/error" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
