import { Home, Users, Briefcase, Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import axios from "axios";

const socket = io("http://localhost:5000", { withCredentials: true });

export function LinkedInHeader() {
  const [notifCount, setNotifCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // 🔹 Fetch notification count
  const fetchNotifCount = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications/count", {
        withCredentials: true,
      });
      setNotifCount(res.data.count || 0);
    } catch (err) {
      console.error("Error fetching notification count:", err);
    }
  };

  useEffect(() => {
    fetchNotifCount();

    socket.on("newNotification", () => {
      fetchNotifCount();
    });

    return () => {
      socket.off("newNotification");
    };
  }, []);

  // ✅ Reset badge count when on notifications page
  useEffect(() => {
    if (location.pathname === "/notifications") {
      setNotifCount(0);
    }
  }, [location.pathname]);

  // ✅ Logout function
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
      navigate("/auth", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // 🟦 Helper to check active route
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* 🔹 Logo */}
          <Link to="/home">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white w-8 h-8 rounded flex items-center justify-center font-bold text-xl">
                LU
              </div>
              <span className="text-xl font-semibold">LynkUp</span>
            </div>
          </Link>

          {/* 🔹 Navigation */}
          <nav className="flex items-center">
            <Link to="/home">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center px-3 ${
                  isActive("/home")
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-xs">Home</span>
              </Button>
            </Link>

            <Link to="/network">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center px-3 ${
                  isActive("/network")
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-xs">My Network</span>
              </Button>
            </Link>

            <Link to="/event">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center px-3 ${
                  isActive("/event")
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span className="text-xs">Events</span>
              </Button>
            </Link>

            <Link to="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center px-3 relative ${
                  isActive("/notifications")
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="text-xs">Notifications</span>
                {notifCount > 0 && !isActive("/notifications") && (
                  <Badge className="absolute -top-0 -right-1 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">
                    {notifCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link to="/profile">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center px-3 ${
                  isActive("/profile")
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs">Me</span>
              </Button>
            </Link>

            {/* 🔹 Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex flex-col items-center px-3 text-red-600 hover:text-red-700"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs">Logout</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}