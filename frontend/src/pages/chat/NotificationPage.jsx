import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import ChatPage from "../chat/ChatPage";
import { LinkedInHeader } from "../../components/linkedin-header";
import { useNavigate } from "react-router-dom";

export default function NotificationPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const navigate = useNavigate();

    // Load current user
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/auth/me", {
                    withCredentials: true,
                });
                setCurrentUser(res.data);

                if (!res.data._id || !res.data.username) {
                    navigate("/auth");
                    return;
                }
            } catch (err) {
                console.error("Error fetching current user:", err);
                navigate("/auth");
            }
        };

        fetchCurrentUser();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/notifications", {
                    withCredentials: true,
                });
                setNotifications(res.data);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedChat]);

    // const handleClick = async (notif) => {
    //     try {
    //         // Mark as read
    //         await axios.put(
    //             `http://localhost:5000/api/notifications/${notif._id}/read`,
    //             {},
    //             { withCredentials: true }
    //         );

    //         // Show ChatPage in
    //         // console.log(notif.sender._id);

    //         if (notif.chatId) {
    //             // setSelectedChat(notif.alumniId);
    //             // setSelectedChat(notif.recipient);
    //             setSelectedChat(notif.sender._id);
    //         } else {
    //             console.error("No chatId found in notification");
    //         }
    //     } catch (err) {
    //         console.error("Error marking notification as read:", err);
    //     }
    // };

    // Group notifications by senderId
    const groupedNotifications = notifications.reduce((acc, notif) => {
        const senderId = notif.sender?._id || "unknown";
        if (!acc[senderId]) {
            acc[senderId] = {
                sender: notif.sender,
                list: [],
                unread: 0,
            };
        }
        acc[senderId].list.push(notif);
        if (!notif.read) acc[senderId].unread += 1;
        return acc;
    }, {});

    // Handle click on a notification group
    const handleClick = async (notifGroup) => {
        try {
            const senderId = notifGroup.sender?._id;

            if (!senderId) return;

            // Delete all notifications from this sender
            await axios.delete(
                `http://localhost:5000/api/notifications/sender/${senderId}`,
                { withCredentials: true }
            );

            // Update UI: remove all notifs of this sender
            setNotifications((prev) =>
                prev.filter((n) => n.sender?._id !== senderId)
            );

            // Open chat with that sender
            setSelectedChat(senderId);
        } catch (err) {
            console.error("Error deleting notifications:", err);
        }
    };

    if (loading) {
        return <LinkedInLoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <LinkedInHeader />

            {selectedChat ? (
                <ChatPage alumniId={selectedChat} onBack={() => setSelectedChat(null)} />
            ) : (
                <div className="max-w-3xl mx-auto p-4">
                    <h2 className="text-2xl font-bold mb-4">Notifications</h2>

                    {notifications.length === 0 ? (
                        <p className="text-muted-foreground">No notifications yet.</p>
                    ) : (
                        <div className="grid gap-4">
                            {Object.values(groupedNotifications).map((group) => (
                                <Card
                                    key={group.sender?._id || "unknown"}
                                    className={group.unread > 0 ? "bg-yellow-200" : "bg-gray-100"}
                                >
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <h3 className="font-semibold">
                                                {group.sender?.username || "Unknown"}
                                            </h3>

                                            {/* Show latest message */}
                                            <p>{group.list[group.list.length - 1].text}</p>

                                            {/* Show count of unread notifications */}
                                            {group.unread > 0 && (
                                                <span className="text-sm text-red-600 font-medium">
                                                    {group.unread} new
                                                </span>
                                            )}

                                            <span className="block text-xs text-gray-500">
                                                Last update:{" "}
                                                {new Date(
                                                    group.list[group.list.length - 1].createdAt
                                                ).toLocaleString()}
                                            </span>
                                        </div>

                                        <Button
                                            variant="outline"
                                            onClick={() => handleClick(group)}
                                        >
                                            Open Chat
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                    )}
                </div>
            )}
        </div>
    );
}
