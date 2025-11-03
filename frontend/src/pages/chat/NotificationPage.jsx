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
        if (!res.data?._id || !res.data?.username) {
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
        const sortedNotifications = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sortedNotifications);

        // ✅ Mark all as read
        axios
          .put(
            "http://localhost:5000/api/notifications/mark-read",
            {},
            { withCredentials: true }
          )
          .catch((err) =>
            console.warn("Failed to mark notifications read:", err)
          );
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // 🔹 Label helper
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
      case "send_post":
        return "📨 Sent Post";
      case "chat":
        return "💬 Chat";
      case "event":
        return "🎉 Event";
      case "repost":
        return "🔁 Repost";
      default:
        return "🔔 Notification";
    }
  };

  // 🔹 Handle navigation
  const handleNotificationClick = (notif) => {
    console.log("Clicked notification:", notif);

    if (notif.link) {
      navigate(notif.link);
      return;
    }

    const { type, sender, eventId } = notif;
    const postId =
      notif.postId?._id ||
      notif.post?._id ||
      (typeof notif.postId === "string" ? notif.postId : null);

    // ✅ Fix: send_post redirects to the single post page
    if (type === "send_post" && postId) {
      navigate(`/post/${postId}`);
      return;
    }

    const postRelated = ["post", "like", "comment", "reply", "repost"];
    if (postRelated.includes(type)) {
      if (postId) {
        navigate(`/post/${postId}`);
        return;
      } else if (sender?._id) {
        navigate(`/profile/${sender._id}`);
        return;
      }
    }

    switch (type) {
      case "follow":
        if (sender?._id) navigate(`/profile/${sender._id}`);
        break;

      case "chat":
        if (sender?._id) navigate(`/chat/${sender._id}`);
        break;

      case "event":
        if (eventId?._id) navigate(`/events/${eventId._id}`);
        else if (eventId) navigate(`/events/${eventId}`);
        break;

      default:
        console.warn("No redirection defined for:", type);
        break;
    }
  };

  if (loading) return <LinkedInLoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInHeader />
      <div className="max-w-3xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Notifications</h2>

        {notifications.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No notifications yet.</p>
        ) : (
          <div className="grid gap-4">
            {notifications.map((notif) => (
              <Card
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`cursor-pointer transition-transform duration-200 hover:scale-[1.01] ${
                  notif.read ? "bg-gray-100" : "bg-yellow-50"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">
                      {notif.sender?.username || "Unknown User"}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {getTypeLabel(notif.type)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {notif.text || "You have a new notification."}
                  </p>

                  <span className="block text-xs text-gray-500 mt-2">
                    {new Date(notif.createdAt).toLocaleString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
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
