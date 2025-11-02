import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { LinkedInHeader } from "../../components/Linkedin-header";
import { useNavigate } from "react-router-dom";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Load current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        if (!res.data._id || !res.data.username) {
          navigate("/auth");
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
        navigate("/auth");
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  // 🔹 Load notifications & mark them as read
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/notifications", {
          withCredentials: true,
        });
        setNotifications(res.data);

        // ✅ Mark all notifications as read
        await axios.put(
          "http://localhost:5000/api/notifications/mark-read",
          {},
          { withCredentials: true }
        );
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // 🔹 Helper: get emoji label based on notification type
  const getTypeLabel = (type) => {
    switch (type) {
      case "follow":
        return "🧑‍🤝‍🧑 Follow";
      case "like":
        return "❤ Like";
      case "comment":
        return "💭 Comment";
      case "reply":
        return "↩ Reply";
      case "post":
        return "📰 Post";
      case "chat":
        return "💬 Chat";
      default:
        return "🔔 Notification";
    }
  };

  if (loading) return <LinkedInLoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInHeader />
      <div className="max-w-3xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Notifications</h2>

        {notifications.length === 0 ? (
          <p className="text-muted-foreground">No notifications yet.</p>
        ) : (
          <div className="grid gap-4">
            {notifications.map((notif) => (
              <Card
                key={notif._id}
                className={`transition-colors ${
                  notif.read ? "bg-gray-100" : "bg-yellow-100"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">
                      {notif.sender?.username || "Unknown"}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {getTypeLabel(notif.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{notif.text}</p>
                  <span className="block text-xs text-gray-500 mt-1">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}