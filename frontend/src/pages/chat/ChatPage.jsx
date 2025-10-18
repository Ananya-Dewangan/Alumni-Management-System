import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ChatPage({ alumniId, chatId, onBack }) {
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);
    // const alumniId = window.location.pathname.split("/").pop();
    // const { chatId } = useParams();

    // console.log(alumniId);


    const navigate = useNavigate();

    const messagesEndRef = useRef(null);

    // Scroll to bottom function
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Run on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // Load current user
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


    // Setup socket connection once
    useEffect(() => {
        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    // Join chat and load messages once both socket and user are loaded
    useEffect(() => {
        if (!socket || !currentUser) return;

        const fetchChat = async () => {
            let res;
            // if (chatId) {
            //     res = await axios.get(
            //         `http://localhost:5000/api/chat/${chatId}`,
            //         { withCredentials: true }
            //     );
            // } else 
            // console.log(alumniId);
            if (alumniId) {
                res = await axios.post(
                    `http://localhost:5000/api/chat/start/${alumniId}`,
                    {},
                    { withCredentials: true }
                );
            }
            setChat(res.data);
            setMessages(res.data.messages || []);

            socket.emit("join_chat", res.data._id);
            socket.emit("join_user", currentUser._id); // personal room for notifications
        };

        fetchChat();
    }, [socket, currentUser, alumniId]);

    // Listen for incoming messages
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
        };

        socket.on("receive_message", handleMessage);
        return () => socket.off("receive_message", handleMessage);
    }, [socket]);

    const handleSend = () => {
        // console.log(chat);
        if (!text || !chat || !currentUser) return;

        const recipientId = chat.participants.find(
            (p) => p.toString() !== currentUser._id
        );

        const messageData = {
            chatId: chat._id,
            senderId: currentUser._id,
            senderName: currentUser.username,
            text,
            recipientId
        };

        socket.emit("send_message", messageData);
        setMessages([...messages, { ...messageData, createdAt: new Date() }]);
        setText("");
    };



    return (
        <div className="flex flex-col h-[80vh] max-w-lg mx-auto border rounded-lg shadow-sm bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-100 rounded-t-lg">
                <button
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    onClick={onBack}
                >
                    ← Back
                </button>
                <h2 className="font-semibold text-gray-800">Chat</h2>
                <div className="w-6" /> {/* spacer */}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
                {messages.map((m, i) => {
                    const isMine =
                        (m.sender?._id || m.sender || m.senderId) === currentUser?._id;

                    return (
                        <div
                            key={i}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[70%] px-3 py-2 border rounded-lg text-sm ${isMine
                                    ? "bg-blue-50 border-blue-200 text-gray-900"
                                    : "bg-gray-50 border-gray-200 text-gray-800"
                                    }`}
                            >
                                <p>{m.text}</p>
                                <span className="block text-xs text-gray-400 mt-1">
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
            <div className="border-t bg-gray-50 p-3 flex items-center gap-2 rounded-b-lg">
                <input
                    className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a message..."
                />
                <button
                    className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-md text-sm font-medium"
                    onClick={handleSend}
                >
                    Send
                </button>
            </div>
        </div>

    );
}
