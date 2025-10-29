import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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

export function MainFeed() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [likeStatus, setLikeStatus] = useState({});
  const [showComments, setShowComments] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSendPopup, setShowSendPopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [recipientUsername, setRecipientUsername] = useState("");
  const [sendStatus, setSendStatus] = useState("");

  // 🟩 Added states for Create Post feature
  const [showPopup, setShowPopup] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const me = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        setCurrentUser(me.data);

        const res = await axios.get("http://localhost:5000/api/posts", {
          withCredentials: true,
        });
        setPosts(res.data);

        const status = {};
        res.data.forEach((post) => {
          status[post._id] = post.likes.includes(me.data._id);
        });
        setLikeStatus(status);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refresh]);

  // 📌 Delete Post
  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`, {
        withCredentials: true,
      });
      setPosts(posts.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // 📌 Edit Post
  const handleEditPost = async (id, oldContent) => {
    const newContent = prompt("Edit your post content:", oldContent);
    if (!newContent || newContent.trim() === oldContent) return;
    try {
      const res = await axios.put(
        `http://localhost:5000/api/posts/${id}`,
        { content: newContent },
        { withCredentials: true }
      );
      setPosts(posts.map((p) => (p._id === id ? res.data : p)));
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  // 📌 Repost
  const handleRepost = async (id) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/posts/repost/${id}`,
        {},
        { withCredentials: true }
      );
      setPosts([res.data, ...posts]);
      alert("Reposted successfully!");
    } catch (err) {
      console.error("Repost failed:", err);
    }
  };

  // 📌 Send (share)
  const handleSend = (post) => {
    const shareLink = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(shareLink);
    alert("Post link copied to clipboard!");
  };

  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // 🟩 Handle Create Post
  const handleAddPost = async () => {
    if (!content.trim() && !imageFile) {
      alert("Please write something or upload an image.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (title) formData.append("title", title);
      if (imageFile) formData.append("image", imageFile);

      const res = await axios.post("http://localhost:5000/api/posts", formData, {
        withCredentials: true,
      });

      setPosts([res.data, ...posts]);
      setShowPopup(false);
      setTitle("");
      setContent("");
      setImageFile(null);
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  if (loading) return <LinkedInLoadingScreen />;

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4 relative">
      {/* 🟩 Floating “+” button for alumni */}
      {currentUser?.role === "alumni" && (
        <Button
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-12 h-12 text-2xl shadow-lg hover:bg-blue-700 transition-all"
          onClick={() => setShowPopup(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* 🟩 Create Post Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              Create a Post
            </h2>

            <input
              type="text"
              placeholder="Add a title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md p-2 mb-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <textarea
              className="w-full border rounded-md p-2 mb-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows="4"
              placeholder="What do you want to talk about?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="mb-4 text-sm"
            />

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPopup(false)}
                className="hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPost}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing posts feed */}
      {posts.map((post) => (
        <Card key={post._id}>
          <CardContent className="p-0">
            <div className="p-4 pb-0 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <img
                  src={
                    post.author?.profilePic ||
                    "https://www.w3schools.com/w3images/avatar3.png"
                  }
                  alt={post.author?.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{post.author?.username}</h3>
                    {post.isPromoted && (
                      <Badge variant="secondary" className="text-xs">
                        Promoted
                      </Badge>
                    )}
                  </div>
                  {post.title && (
                    <p className="text-base font-medium mt-1">{post.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{post.content}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* ⋯ Menu for author only */}
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
                          handleEditPost(post._id, post.content);
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

            {post.image_url && (
              <img
                src={post.image_url}
                alt="post"
                className="w-full object-cover mt-2"
              />
            )}
            <Separator className="my-2" />

            {/* Actions */}
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
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleSend(post)}
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </Button>
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
