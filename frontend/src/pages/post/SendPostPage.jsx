import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams, useNavigate } from "react-router-dom";

export default function SendPostPage() {
  const { postId } = useParams();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // 🔹 Fetch all users the current user follows
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/follow/all", {
          withCredentials: true,
        });
        setUsers(res.data.users);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  // 🔹 Send post to selected recipient
  const handleSendPost = async (recipientId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/send-post/send-post", // ✅ simplified route
        {
          postId,
          recipients: [recipientId],
        },
        { withCredentials: true }
      );

      alert("✅ Post sent successfully!");
      navigate("/notifications");
    } catch (err) {
      console.error("❌ Send post failed:", err.response?.data || err);
      alert("Failed to send post");
    }
  };

  // ✅ Fixed filter syntax
  const filtered = users.filter((u) =>
    `${u.firstname} ${u.lastname} ${u.username}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Send Post</h2>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <Input
        placeholder="Search user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center">No users found.</p>
        ) : (
          filtered.map((u) => (
            <div
              key={u._id}
              className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    u.profilePic ||
                    "https://www.w3schools.com/w3images/avatar3.png"
                  }
                  alt={u.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">
                    {u.firstname} {u.lastname}
                  </p>
                  <p className="text-sm text-gray-500">@{u.username}</p>
                </div>
              </div>
              <Button
                onClick={() => handleSendPost(u._id)}
                className="bg-blue-600 text-white"
              >
                Send
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
