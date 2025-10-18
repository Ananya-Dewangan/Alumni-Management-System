import { Search, Home, Users, Briefcase, MessageCircle, Bell, Grid3X3, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link, Routes, Route } from "react-router-dom"
import HomePage from "@/pages/post/Home"
import { io } from "socket.io-client";
import { useEffect, useState } from "react"
import axios from "axios"

const socket = io("http://localhost:5000", { withCredentials: true });

export function LinkedInHeader() {

    const [notifCount, setNotifCount] = useState(0);

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

        // ✅ Listen for new notifications via socket
        socket.on("newNotification", () => {
            fetchNotifCount(); // refresh count instantly
        });

        return () => {
            socket.off("newNotification");
        };
    }, []);

    return (
        <header className="bg-card bg-white border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    {/* Left section - Logo and Search */}
                    <Link to="/home">
                        <div className="flex items-center gap-2">
                            {/* LinkedIn Logo */}
                            <div className="bg-blue-600 text-white text-primary-foreground w-8 h-8 rounded flex items-center justify-center font-bold text-xl">
                                CU
                            </div>

                            <span className="text-xl">ConnUs</span>
                        </div>
                    </Link>

                    {/* Right section - Navigation */}
                    <nav className="flex items-center">
                        <div className="flex items-center">
                            {/* Home */}
                            <Link to="/home">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex flex-col items-center gap-1 px-3 py-2 h-auto text-primary"
                                >
                                    <Home className="w-5 h-5" />
                                    <span className="text-xs">Home</span>
                                </Button>
                            </Link>

                            {/* My Network */}
                            <Link to="/network">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex flex-col items-center gap-1 px-3 py-2 h-auto text-muted-foreground hover:text-foreground"
                                >
                                    <Users className="w-5 h-5" />
                                    <span className="text-xs">My Network</span>
                                </Button>
                            </Link>

                            {/* Jobs */}
                            <Link to="/event">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex flex-col items-center gap-1 px-3 py-2 h-auto text-muted-foreground hover:text-foreground"
                                >
                                    <Briefcase className="w-5 h-5" />
                                    <span className="text-xs">Jobs</span>
                                </Button>
                            </Link>

                            {/* Notifications */}
                            <Link to="/notifications">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex flex-col items-center gap-1 px-3 py-2 h-auto text-muted-foreground hover:text-foreground relative"
                                >
                                    <Bell className="w-5 h-5" />
                                    <span className="text-xs">Notifications</span>
                                    {notifCount > 0 && (
                                        <Badge
                                            className="absolute -top-0 -right-1 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full"
                                        >
                                            {notifCount}
                                        </Badge>
                                    )}


                                </Button>
                            </Link>

                            {/* Me */}
                            <Link to="/profile">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex flex-col items-center gap-1 px-3 py-2 h-auto text-muted-foreground hover:text-foreground"
                                >
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs">Me</span>
                                </Button>
                            </Link>
                            {/* For logout */}
                            <Link to="/logout">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex flex-col items-center gap-1 px-3 py-2 h-auto text-muted-foreground hover:text-foreground"
                                >
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12H3m12 0l-4-4m4 4l-4 4m8-8v8a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2a2 2 0 00-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <span className="text-xs">Logout</span>
                                </Button>
                            </Link>

                            {/* Try Premium */}
                            {/* <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 text-amber-600 border-amber-600 hover:bg-amber-50 bg-transparent"
                            >
                                Try Premium for ₹0
                            </Button> */}
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    )
}
