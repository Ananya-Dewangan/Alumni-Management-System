import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MessageCircle, Repeat2, Send } from "lucide-react";
import LikeButton from "./LikeButton";
import CommentsSection from "./CommentsSection";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";

export default function SinglePost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [likeStatus, setLikeStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const me = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        setCurrentUser(me.data);

        let postRes;
        try {
          postRes = await axios.get(
            `http://localhost:5000/api/posts/${id}`,
            { withCredentials: true }
          );
        } catch (err) {
          if (err.response && err.response.status === 404) {
            navigate("/error");
            return;
          }
          throw err;
        }

        const followRes = await axios.get(
          "http://localhost:5000/api/follow/following",
          { withCredentials: true }
        );

        setPost(postRes.data);
        setFollowingUsers(followRes.data.following.map((u) => u._id));
        setLikeStatus({
          [postRes.data._id]: postRes.data.likes.includes(me.data._id),
        });
      } catch (err) {
        console.error("❌ Error loading post:", err);
      }
    };
    fetchPost();
  }, [id, navigate]);

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
      console.error("Follow toggle failed:", err);
    }
  };

  const handleRepost = async () => {
    try {
      await axios.post(
        `http://localhost:5000/api/posts/repost/${post._id}`,
        {},
        { withCredentials: true }
      );
      alert("🔁 Reposted successfully!");
      navigate("/feed");
    } catch (err) {
      console.error("Repost failed:", err);
    }
  };

  if (!post) return <LinkedInLoadingScreen />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card className="rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 flex items-start justify-between bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
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
                        navigate(`/profile/${post.repostFrom.author?._id}`)
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
              setPosts={() => {}}
              likeStatus={likeStatus}
              setLikeStatus={setLikeStatus}
            />
            <button
              onClick={() =>
                document.getElementById("comments").scrollIntoView()
              }
              className="flex items-center gap-2 text-sm hover:text-blue-600"
            >
              <MessageCircle className="w-4 h-4" /> Comment
            </button>
            <button
              onClick={handleRepost}
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

          <div id="comments" className="mt-2 px-6 pb-4">
            <CommentsSection postId={post._id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
