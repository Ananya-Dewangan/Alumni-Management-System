import axios from "axios";
import { ThumbsUp } from "lucide-react";

const LikeButton = ({ post, setPosts, likeStatus, setLikeStatus }) => {
  const handleLike = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/posts/like/${post._id}`,
        {},
        { withCredentials: true }
      );

      // Update posts likes array in parent
      setPosts((prev) =>
        prev.map((p) =>
          p._id === post._id ? { ...p, likes: res.data } : p
        )
      );

      // Toggle likeStatus in parent
      setLikeStatus((prev) => ({
        ...prev,
        [post._id]: !prev[post._id],
      }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      onClick={handleLike}
      className="flex items-center gap-1 text-base group"
    >
      <ThumbsUp
        className={`w-4 h-4 transition-colors ${likeStatus[post._id] ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
          }`}
      />
      <span
        className={`transition-colors ${likeStatus[post._id]
            ? "text-blue-600 font-bold"
            : "text-gray-600 group-hover:text-blue-500"
          }`}
      >
        {likeStatus[post._id] ? "Liked" : "Like"}
      </span>
    </button>

  );
};

export default LikeButton;
