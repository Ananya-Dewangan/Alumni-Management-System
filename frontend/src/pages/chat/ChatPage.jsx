import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { ArrowLeft, Send } from "lucide-react";

export default function ChatPage({ alumniId, chatId, onBack }) {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Error fetching current user:", err);
        navigate("/auth");
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const fetchChat = async () => {
      let res;
      if (alumniId) {
        res = await axios.post(
          `http://localhost:5000/api/chat/start/${alumniId}`,
          {},
          { withCredentials: true }
        );
      } else if (chatId) {
        res = await axios.get(`http://localhost:5000/api/chat/${chatId}`, {
          withCredentials: true,
        });
      }

      setChat(res.data);
      setMessages(res.data.messages || []);

      socket.emit("join_chat", res.data._id);
      socket.emit("join_user", currentUser._id);
    };

    fetchChat();
  }, [socket, currentUser, alumniId, chatId]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      if (msg.senderId === currentUser?._id) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive_message", handleMessage);
    return () => socket.off("receive_message", handleMessage);
  }, [socket, currentUser]);

  const handleSend = () => {
    if (!text || !chat || !currentUser) return;

    const recipientId = chat.participants.find(
      (p) => p.toString() !== currentUser._id
    );

    const messageData = {
      chatId: chat._id,
      senderId: currentUser._id,
      text,
      recipientId,
      createdAt: new Date(),
    };

    socket.emit("send_message", messageData);
    setMessages((prev) => [...prev, { ...messageData, sender: currentUser }]);
    setText("");
  };

  return (
    <div className="flex flex-col h-[88vh] max-w-3xl mx-auto border border-gray-200 rounded-3xl shadow-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-3xl shadow-md">
        <button
          className="flex items-center gap-1 text-sm hover:text-gray-200 transition"
          onClick={onBack}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="font-semibold text-lg tracking-wide">Chat</h2>
        <div className="w-6" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40 backdrop-blur-sm">
        {messages.map((m, i) => {
          const isMine =
            (m.sender?._id || m.sender || m.senderId) === currentUser?._id;
          return (
            <div
              key={i}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-5 py-3 text-sm rounded-3xl shadow-sm transition-all duration-300 ${
                  isMine
                    ? "bg-gradient-to-br from-blue-500/90 to-indigo-500/90 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <p>{m.text}</p>
                <span
                  className={`block text-xs mt-1 ${
                    isMine ? "text-blue-200" : "text-gray-500"
                  }`}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4 flex items-center gap-3 rounded-b-3xl shadow-inner">
        <input
          className="flex-1 border border-gray-200 rounded-full px-5 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-3 rounded-full shadow-md flex items-center gap-1 transition-all"
          onClick={handleSend}
        >
          <Send size={16} /> Send
        </button>
      </div>
    </div>
  );
}
