import { useEffect, useState } from "react";
import axios from "axios";
import LikeButton from "./LikeButton"
import CommentsSection from "./CommentsSection"

function Home() {
    const [posts, setPosts] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState("");
    const [likeStatus, setLikeStatus] = useState({}); // track likes per post
    const [commentText, setCommentText] = useState({});

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:5000/api/auth/me", { withCredentials: true })
            .then(res => setCurrentUser(res.data))
            .catch(() => setCurrentUser(null));
    }, []);



    // 📌 Fetch posts   
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/posts", { withCredentials: true });
                setPosts(res.data);

                const me = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
                console.log(res.data);
                const status = {};
                res.data.forEach(post => {
                    status[post._id] = post.likes.includes(me.data._id);
                });
                setLikeStatus(status);

            } catch (err) {
                console.error(err);
            }
        };
        fetchPosts();
    }, []);




    // 📌 Create post
    const handleAddPost = async () => {
        if (!title || !content || !imageFile) {
            setShowPopup(false);
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("image", imageFile);

        try {
            const res = await axios.post(
                "http://localhost:5000/api/posts",
                formData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            setPosts([res.data, ...posts]);
            setTitle("");
            setContent("");
            setImageFile(null);
            setShowPopup(false);
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <div className="max-w-2xl mx-auto p-4">
            {/* Posts List */}
            <h1 className="text-xl font-bold mb-4">Home</h1>
            <div className="space-y-4">
                {posts.map((post) => (
                    <div
                        key={post._id}
                        className="p-4 border rounded-lg shadow-sm bg-white"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <img
                                src={post.author?.profilePic || "https://www.w3schools.com/w3images/avatar3.png"}
                                alt="avatar"
                                className="w-8 h-8 rounded-full"
                            />
                            <span className="font-semibold">{post.author?.username}</span>
                            <span className="text-gray-500 text-xs ml-auto">
                                {new Date(post.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <h2 className="font-bold text-lg">{post.title}</h2>
                        <p className="mb-2">{post.content}</p>
                        {post.image_url && (
                            <img
                                src={post.image_url}
                                alt="post"
                                className="rounded-md mt-2"
                            />
                        )}

                        <LikeButton
                            post={post}
                            setPosts={setPosts}
                            likeStatus={likeStatus}
                            setLikeStatus={setLikeStatus}
                        />

                        <CommentsSection postId={post._id} />

                    </div>
                ))}
            </div>

            {/* Floating + Button */}
            <button

                onClick={() => setShowPopup(true)}
                className="fixed bottom-6 right-6 bg-blue-500 text-white text-2xl px-4 py-2 rounded-full shadow-lg hover:bg-blue-600"
            >
                +
            </button>

            {/* Popup for Creating Post */}
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg w-96">
                        <h2 className="text-lg font-bold mb-2">Create Post</h2>
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="border w-full p-2 mb-2"
                        />
                        <textarea
                            placeholder="Content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="border w-full p-2 mb-2"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowPopup(false)}
                                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddPost}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
