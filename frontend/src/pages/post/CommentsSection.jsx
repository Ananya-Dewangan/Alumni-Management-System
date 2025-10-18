import { useState, useEffect} from "react";
import axios from "axios";

export default function CommentsSection({ postId }) {
  const [showComments, setShowComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);

  // fetch comments with pagination
  
  const fetchComments = async (pageNum = 1) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/posts/comment/${postId}?page=${pageNum}&limit=5`,
        { withCredentials: true }
      );

      if (pageNum === 1) {
        setComments(res.data.comments);
      } else {
        setComments((prev) => [...prev, ...res.data.comments]);
      }

      setTotalComments(res.data.total);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComments(1);
  }, []);

  // add new comment
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      await axios.post(
        `http://localhost:5000/api/posts/comment/${postId}`,
        { text: commentText },
        { withCredentials: true }
      );
      setCommentText("");
      fetchComments(1); // refresh latest 5 after posting
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Toggle button */}
      {/* <button
        onClick={() => {
          setShowComments(!showComments);
          if (!showComments) fetchComments(1);
        }}
        className="text-blue-500 hover:underline text-sm mt-2"
      >
        Comment
      </button> */}

      {showComments && (
        <div className="mt-2">
          {/* Comment input */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="border p-1 flex-1 rounded text-sm"
            />
            <button
              onClick={handleCommentSubmit}
              className="bg-blue-500 text-white px-2 rounded text-sm"
            >
              Post
            </button>
          </div>

          {/* Render comments */}
          {comments.map((c) => (
            <div key={c._id} className="flex items-center gap-2 text-sm mb-1">
              <img
                src={c.user?.profilePic || "/default-avatar.png"}
                alt="avatar"
                className="w-5 h-5 rounded-full"
              />
              <span className="font-semibold">{c.user?.username}:</span> {c.text}
            </div>
          ))}

          {/* Load more */}
          {comments.length < totalComments && (
            <button
              onClick={() => fetchComments(page + 1)}
              className="text-gray-500 text-xs mt-1"
            >
              Load more comments
            </button>
          )}
        </div>
      )}
    </div>
  );
}
