import { Home, Users, Briefcase, Bell, User, LogOut, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import axios from "axios";

const socket = io("http://localhost:5000", { withCredentials: true });

export function LinkedInHeader() {
  const [notifCount, setNotifCount] = useState(0);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 🔹 Fetch logged-in user (to check role)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

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

  // 🎨 Reusable active style
  const navButtonStyle = (path) =>
    `flex flex-col items-center px-3 relative transition-all duration-200 ease-in-out 
     ${isActive(path)
       ? "text-blue-600 scale-110 after:content-[''] after:absolute after:bottom-0 after:w-6 after:h-[2px] after:bg-blue-600 after:rounded-full"
       : "text-gray-600 hover:text-blue-600 hover:scale-105 hover:bg-gray-50"
     }`;

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
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
          <nav className="flex items-center gap-2">
            <Link to="/home">
              <Button variant="ghost" size="sm" className={navButtonStyle("/home")}>
                <Home className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">Home</span>
              </Button>
            </Link>

            <Link to="/network">
              <Button variant="ghost" size="sm" className={navButtonStyle("/network")}>
                <Users className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">My Network</span>
              </Button>
            </Link>

            <Link to="/event">
              <Button variant="ghost" size="sm" className={navButtonStyle("/event")}>
                <Briefcase className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">Events</span>
              </Button>
            </Link>

            {/* 🔹 Admin Data Export */}
            {user?.role === "admin" && (
              <Link to="/admin-data-export">
                <Button variant="ghost" size="sm" className={navButtonStyle("/admin-data-export")}>
                  <Database className="w-5 h-5 mb-0.5" />
                  <span className="text-xs font-medium">Export Data</span>
                </Button>
              </Link>
            )}

            <Link to="/notifications">
              <Button variant="ghost" size="sm" className={`${navButtonStyle("/notifications")} relative`}>
                <Bell className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">Notifications</span>
                {notifCount > 0 && !isActive("/notifications") && (
                  <Badge className="absolute -top-0 -right-1 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full shadow">
                    {notifCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link to="/profile">
              <Button variant="ghost" size="sm" className={navButtonStyle("/profile")}>
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium">Me</span>
              </Button>
            </Link>

            {/* 🔹 Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex flex-col items-center px-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Logout</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
