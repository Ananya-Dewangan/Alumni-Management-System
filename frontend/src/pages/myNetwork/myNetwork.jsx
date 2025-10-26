import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { LinkedInHeader } from "../../components/Linkedin-header";
import ChatPage from "../chat/ChatPage";
import { useNavigate } from "react-router-dom";

export default function MyNetwork() {
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // Fetch current user
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
  }, [navigate]);

  // Fetch all other users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/follow/all", {
          withCredentials: true,
        });
        setAllUsers(res.data.users || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setAllUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <LinkedInLoadingScreen />;

  // Filter users by name, username, or role
  const filteredUsers = allUsers.filter((user) => {
    const fullName = `${user.firstname || ""} ${user.lastname || ""}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInHeader />

      {selectedAlumni ? (
        <ChatPage alumniId={selectedAlumni._id} onBack={() => setSelectedAlumni(null)} />
      ) : (
        <div className="max-w-3xl mx-auto p-4">
          <h2 className="text-2xl font-bold mb-4">My Network</h2>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search by name, username or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground">No matching users found.</p>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user._id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          user.profilePic ||
                          "https://www.w3schools.com/w3images/avatar3.png"
                        }
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold">
                          {user.firstname
                            ? `${user.firstname} ${user.lastname}`
                            : user.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.role}
                        </p>
                      </div>
                    </div>

                    {/* Message + View Profile Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedAlumni(user)}
                      >
                        Message
                      </Button>
                      <Button
                        className="border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-200"
                        onClick={() => navigate(`/profile/${user._id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
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
