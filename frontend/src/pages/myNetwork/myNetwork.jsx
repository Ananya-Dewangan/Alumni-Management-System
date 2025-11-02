import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { LinkedInHeader } from "../../components/Linkedin-header";
import ChatPage from "../chat/ChatPage";
import { useNavigate } from "react-router-dom";
import { MessageCircle, UserRound } from "lucide-react";

export default function MyNetwork() {
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        setCurrentUser(res.data);
        if (!res.data._id || !res.data.username) navigate("/auth");
      } catch (err) {
        console.error("Error fetching current user:", err);
        navigate("/auth");
      }
    };
    fetchCurrentUser();
  }, [navigate]);

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

  const filteredUsers = allUsers.filter((user) => {
    const fullName = `${user.firstname || ""} ${user.lastname || ""}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50">
      <LinkedInHeader />

      {selectedAlumni ? (
        <ChatPage alumniId={selectedAlumni._id} onBack={() => setSelectedAlumni(null)} />
      ) : (
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
              My <span className="text-blue-600">Network</span>
            </h2>
          </div>

          {/* 🔍 Search Bar */}
          <div className="mb-8">
            <Input
              type="text"
              placeholder="🔍 Search alumni by name, username or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center mt-8 text-sm italic">
              No matching users found.
            </p>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-lg divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <div
                  key={user._id}
                  className={`flex items-center justify-between px-5 py-4 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/60 ${
                    index === 0 ? "rounded-t-2xl" : ""
                  } ${index === filteredUsers.length - 1 ? "rounded-b-2xl" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        user.profilePic ||
                        "https://www.w3schools.com/w3images/avatar3.png"
                      }
                      alt={user.username}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-100 shadow-sm"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {user.firstname
                          ? `${user.firstname} ${user.lastname}`
                          : user.username}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {user.role || "Alumni"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 rounded-lg shadow-sm"
                      onClick={() => setSelectedAlumni(user)}
                    >
                      <MessageCircle size={16} />
                      Message
                    </Button>

                    <Button
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 rounded-lg shadow-md"
                      onClick={() => navigate(`/profile/${user._id}`)}
                    >
                      <UserRound size={16} />
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
