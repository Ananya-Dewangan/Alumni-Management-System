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
import { motion, AnimatePresence } from "framer-motion";

export function MainFeed() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [likeStatus, setLikeStatus] = useState({});
  const [showComments, setShowComments] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState([]);

  const [showPopup, setShowPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPostId, setEditPostId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const navigate = useNavigate();

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
  }, []);

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
      alert("🗑 Post deleted!");
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {(currentUser?.role === "alumni" ||
        currentUser?.role === "student" ||
        currentUser?.role === "admin") && (
        <Button
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-transform hover:scale-105 rounded-full w-16 h-16 flex items-center justify-center"
          onClick={() => setShowPopup(true)}
        >
          <Plus className="w-7 h-7" />
        </Button>
      )}

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-[30rem] shadow-2xl border border-gray-100"
            >
              <h2 className="text-2xl font-semibold mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editMode ? "Edit Your Post ✏" : "Create New Post 🪶"}
              </h2>
              <input
                type="text"
                placeholder="Post title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 mb-3 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                rows="4"
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 mb-3 text-sm focus:ring-2 focus:ring-purple-500"
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="preview"
                  className="w-full h-52 object-cover rounded-lg mb-3 shadow"
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
                  className="rounded-full"
                  onClick={() => {
                    setShowPopup(false);
                    setEditMode(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePost}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full"
                >
                  {editMode ? "Save Changes" : "Post Now"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {posts.map((post) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="rounded-3xl border border-gray-200 bg-white shadow-lg hover:shadow-2xl hover:border-blue-200 transition-all duration-300 mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 flex items-start justify-between bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        post.author?.profilePic ||
                        "https://www.w3schools.com/w3images/avatar3.png"
                      }
                      alt={post.author?.username}
                      className="w-14 h-14 rounded-full object-cover border border-gray-300 cursor-pointer"
                      onClick={() => navigate(`/profile/${post.author?._id}`)}
                    />
                    <div>
                      <h3
                        className="font-semibold text-gray-900 hover:text-blue-700 cursor-pointer text-lg"
                        onClick={() => navigate(`/profile/${post.author?._id}`)}
                      >
                        {post.author?.username}
                      </h3>

                      {post.repostFrom && (
                        <p className="text-xs text-gray-600 italic mt-1">
                          🔁 Reposted from{" "}
                          <span
                            className="text-blue-600 hover:underline cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/profile/${post.repostFrom.author?._id}`
                              )
                            }
                          >
                            {post.repostFrom.author?.username || "Unknown User"}
                          </span>
                          {post.repostFrom.content && (
                            <>
                              :{" "}
                              <span
                                className="text-gray-800 cursor-pointer hover:underline"
                                onClick={() =>
                                  navigate(`/post/${post.repostFrom._id}`)
                                }
                              >
                                {post.repostFrom.content.length > 50
                                  ? post.repostFrom.content.slice(0, 50) + "..."
                                  : post.repostFrom.content}
                              </span>
                            </>
                          )}
                        </p>
                      )}

                      <p className="text-sm text-gray-700 mt-1">{post.content}</p>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    {post.author?._id !== currentUser?._id && (
                      <Button
                        size="sm"
                        className={`text-xs rounded-full px-3 py-1 transition ${
                          followingUsers.includes(post.author?._id)
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                        }`}
                        onClick={() => handleFollowToggle(post.author?._id)}
                      >
                        {followingUsers.includes(post.author?._id)
                          ? "Following"
                          : "Follow"}
                      </Button>
                    )}

                    {currentUser?._id === post.author?._id && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setMenuOpen(menuOpen === post._id ? null : post._id)
                          }
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                        {menuOpen === post._id && (
                          <div className="absolute right-0 mt-2 w-32 bg-white border rounded-xl shadow-lg z-10">
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
                    className="w-full max-h-[500px] object-cover"
                  />
                )}

                <Separator className="my-2" />

                <div className="px-8 py-3 flex items-center justify-between text-gray-700">
                  <LikeButton
                    post={post}
                    setPosts={setPosts}
                    likeStatus={likeStatus}
                    setLikeStatus={setLikeStatus}
                  />
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center gap-2 text-sm hover:text-blue-600"
                  >
                    <MessageCircle className="w-4 h-4" /> Comment
                  </button>
                  <button
                    onClick={() => handleRepost(post._id)}
                    className="flex items-center gap-2 text-sm hover:text-purple-600"
                  >
                    <Repeat2 className="w-4 h-4" /> Repost
                  </button>
                  <button
                    onClick={() => navigate(`/send-post/${post._id}`)}
                    className="flex items-center gap-2 text-sm hover:text-pink-600"
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                </div>

                {showComments[post._id] && (
                  <div className="mt-2 px-6 pb-4">
                    <CommentsSection postId={post._id} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  
}

