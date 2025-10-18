import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { LinkedInHeader } from "../../components/linkedin-header";
import ChatPage from "../chat/ChatPage";
import { useNavigate } from "react-router-dom";

export default function MyNetwork() {
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedAlumni, setSelectedAlumni] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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
                const res1 = await axios.get("http://localhost:5000/api/follow/following", {
                    withCredentials: true,
                });
                setFollowing(res1.data);

                const res2 = await axios.get("http://localhost:5000/api/follow/followers", {
                    withCredentials: true,
                });
                setFollowers(res2.data);
            } catch (err) {
                console.error("Error fetching following/followers:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <LinkedInLoadingScreen />;
    }

    // Filter users based on search term
    const filteredFollowing = following.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredFollowers = followers.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <LinkedInHeader />

            {selectedAlumni ? (
                <ChatPage alumniId={selectedAlumni._id} onBack={() => setSelectedAlumni(null)} />
            ) : (
                <div className="max-w-3xl mx-auto p-4">
                    <h2 className="text-2xl font-bold mb-4">My Network</h2>

                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder="Search by name or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* If student → show following list */}
                    {currentUser?.role === "student" && (
                        filteredFollowing.length === 0 ? (
                            <p className="text-muted-foreground">No matching users found.</p>
                        ) : (
                            <div className="grid gap-4">
                                {filteredFollowing.map((user) => (
                                    <Card key={user._id}>
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.profilePic || "https://www.w3schools.com/w3images/avatar3.png"}
                                                    alt={user.username}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                                <div>
                                                    <h3 className="font-semibold">{user.username}</h3>
                                                    <p className="text-sm text-muted-foreground">{user.role}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" onClick={() => setSelectedAlumni(user)}>Message</Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    )}

                    {/* If alumni → show followers list */}
                    {currentUser?.role === "alumni" && (
                        filteredFollowers.length === 0 ? (
                            <p className="text-muted-foreground">No matching users found.</p>
                        ) : (
                            <div className="grid gap-4">
                                {filteredFollowers.map((user) => (
                                    <Card key={user._id}>
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.profilePic || "https://www.w3schools.com/w3images/avatar3.png"}
                                                    alt={user.username}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                                <div>
                                                    <h3 className="font-semibold">{user.username}</h3>
                                                    <p className="text-sm text-muted-foreground">{user.role}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" onClick={() => setSelectedAlumni(user)}>Message</Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
