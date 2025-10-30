import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import LikeButton from "./LikeButton";
import CommentsSection from "./CommentsSection";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { useNavigate } from "react-router-dom";

export function MainFeed() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [likeStatus, setLikeStatus] = useState({});
  const [showComments, setShowComments] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState([]);

  // Create/Edit Post states
  const [showPopup, setShowPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPostId, setEditPostId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const navigate = useNavigate();

  // 🟦 Fetch current user, following list, and posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const me = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        setCurrentUser(me.data);

        const [postsRes, followRes] = await Promise.all([
          axios.get("http://localhost:5000/api/posts", { withCredentials: true }),
          axios.get("http://localhost:5000/api/follow/following", {
            withCredentials: true,
          }),
        ]);

        setPosts(postsRes.data);
        setFollowingUsers(followRes.data.following.map((u) => u._id));

        const status = {};
        postsRes.data.forEach((post) => {
          status[post._id] = post.likes.includes(me.data._id);
        });
        setLikeStatus(status);
      } catch (err) {
        console.error("❌ Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refresh]);

  // 🟦 Follow / Unfollow Toggle
  const handleFollowToggle = async (userId) => {
    try {
      const isFollowing = followingUsers.includes(userId);
      const route = isFollowing ? "unfollow" : "follow";

      await axios.post(
        `http://localhost:5000/api/follow/${route}/${userId}`,
        {},
        { withCredentials: true }
      );

      setFollowingUsers((prev) =>
        isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    } catch (err) {
      console.error("Follow/Unfollow failed:", err);
      alert("Action failed. Try again.");
    }
  };

  // 🟩 Create or Edit Post
  const handleSavePost = async () => {
    if (!content.trim() && !imageFile && !editMode) {
      alert("Please write something or upload an image.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (imageFile) formData.append("image", imageFile);

      let res;
      if (editMode) {
        res = await axios.put(
          `http://localhost:5000/api/posts/${editPostId}`,
          formData,
          { withCredentials: true }
        );
        alert("✅ Post updated!");
      } else {
        res = await axios.post("http://localhost:5000/api/posts", formData, {
          withCredentials: true,
        });
        alert("✅ Post created!");
      }

      setPosts(
        editMode
          ? posts.map((p) => (p._id === editPostId ? res.data : p))
          : [res.data, ...posts]
      );
      setShowPopup(false);
      setTitle("");
      setContent("");
      setImageFile(null);
      setPreviewImage(null);
      setEditMode(false);
    } catch (err) {
      console.error("Error saving post:", err);
      alert("Failed to save post.");
    }
  };

  const handleEditPost = (post) => {
    setEditMode(true);
    setEditPostId(post._id);
    setTitle(post.title || "");
    setContent(post.content || "");
    setPreviewImage(post.image_url || null);
    setShowPopup(true);
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`, {
        withCredentials: true,
      });
      setPosts(posts.filter((p) => p._id !== id));
      alert("🗑️ Post deleted!");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleRepost = async (id) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/posts/repost/${id}`,
        {},
        { withCredentials: true }
      );
      setPosts([res.data, ...posts]);
      alert("🔁 Reposted successfully!");
    } catch (err) {
      console.error("Repost failed:", err);
    }
  };

  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  if (loading) return <LinkedInLoadingScreen />;

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4 relative">
      {/* Floating + Button */}
      {(currentUser?.role === "alumni" ||
        currentUser?.role === "student" ||
        currentUser?.role === "admin") && (
        <Button
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-12 h-12 shadow-lg hover:bg-blue-700"
          onClick={() => setShowPopup(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* Create/Edit Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-lg font-semibold mb-3">
              {editMode ? "Edit Post" : "Create Post"}
            </h2>
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md p-2 mb-3 text-sm"
            />
            <textarea
              rows="4"
              placeholder="Write something..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border rounded-md p-2 mb-3 text-sm"
            />
            {previewImage && (
              <img
                src={previewImage}
                alt="preview"
                className="w-full h-40 object-cover mb-3 rounded-lg"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setImageFile(e.target.files[0]);
                setPreviewImage(URL.createObjectURL(e.target.files[0]));
              }}
              className="mb-4 text-sm"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPopup(false);
                  setEditMode(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSavePost} className="bg-blue-600 text-white">
                {editMode ? "Save" : "Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      {posts.map((post) => (
        <Card key={post._id}>
          <CardContent className="p-0">
            <div className="p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <img
                  src={
                    post.author?.profilePic ||
                    "https://www.w3schools.com/w3images/avatar3.png"
                  }
                  alt={post.author?.username}
                  className="w-12 h-12 rounded-full object-cover cursor-pointer"
                  onClick={() => navigate(`/profile/${post.author?._id}`)}
                />
                <div>
                  <h3
                    className="font-semibold text-blue-700 hover:underline cursor-pointer"
                    onClick={() => navigate(`/profile/${post.author?._id}`)}
                  >
                    {post.author?.username}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {post.content}
                  </p>
                  <span className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                {/* Follow Button */}
                {post.author?._id !== currentUser?._id && (
                  <Button
                    size="sm"
                    className={`text-xs transition ${
                      followingUsers.includes(post.author?._id)
                        ? "bg-blue-200 text-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    onClick={() => handleFollowToggle(post.author?._id)}
                  >
                    {followingUsers.includes(post.author?._id)
                      ? "Following"
                      : "Follow"}
                  </Button>
                )}

                {/* Action Menu */}
                {currentUser?._id === post.author?._id && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setMenuOpen(menuOpen === post._id ? null : post._id)
                      }
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    {menuOpen === post._id && (
                      <div className="absolute right-0 mt-2 w-28 bg-white border rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            setMenuOpen(null);
                            handleEditPost(post);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpen(null);
                            handleDeletePost(post._id);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {post.image_url && (
              <img
                src={post.image_url}
                alt="post"
                className="w-full object-cover mt-2"
              />
            )}

            <Separator className="my-2" />

            {/* Post Actions */}
            <div className="px-4 py-2 flex items-center justify-around">
              <LikeButton
                post={post}
                setPosts={setPosts}
                likeStatus={likeStatus}
                setLikeStatus={setLikeStatus}
              />
              <button
                onClick={() => toggleComments(post._id)}
                className="flex items-center gap-2 text-sm hover:text-blue-500"
              >
                <MessageCircle className="w-4 h-4" /> Comment
              </button>
              <button
                onClick={() => handleRepost(post._id)}
                className="flex items-center gap-2 text-sm hover:text-blue-500"
              >
                <Repeat2 className="w-4 h-4" /> Repost
              </button>
              <button
                onClick={() => navigate(`/send-post/${post._id}`)}
                className="flex items-center gap-2 text-sm hover:text-blue-500"
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </div>

            {showComments[post._id] && (
              <div className="mt-2 px-4">
                <CommentsSection postId={post._id} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
