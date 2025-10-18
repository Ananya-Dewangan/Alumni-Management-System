import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, Repeat2, Send, MoreHorizontal } from "lucide-react";
import LikeButton from "./LikeButton";
import CommentsSection from "./CommentsSection";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";

export function MainFeed() {
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [likeStatus, setLikeStatus] = useState({});
    const [showComments, setShowComments] = useState({});
    const [following, setFollowing] = useState([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(true);

    const toggleComments = (postId) => {
        setShowComments((prev) => ({
            ...prev,
            [postId]: !prev[postId], // toggle only this post
        }));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Current user
                const me = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
                setCurrentUser(me.data);
                setFollowing(me.data.following || []);

                // Posts
                const res = await axios.get("http://localhost:5000/api/posts", { withCredentials: true });
                setPosts(res.data);

                const status = {};
                res.data.forEach(post => {
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
            setLoading(true);
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
            setRefresh((prev) => !prev);
        } catch (err) {
            console.error(err);
        }
    };

    // Handle follow/unfollow
    const handleFollow = async (alumniId) => {
        try {
            setLoading(true);
            const isFollowing = following.includes(alumniId);

            if (isFollowing) {
                await axios.post(`http://localhost:5000/api/follow/unfollow/${alumniId}`, {}, { withCredentials: true });
                setFollowing(following.filter(id => id !== alumniId));
            } else {
                await axios.post(`http://localhost:5000/api/follow/follow/${alumniId}`, {}, { withCredentials: true });
                setFollowing([...following, alumniId]);
            }
            setRefresh((prev) => !prev);
        } catch (err) {
            console.error(err);
        } 
    };

    if (loading) {
        return <LinkedInLoadingScreen />;
    }

    return (
        <div className="space-y-4 max-w-2xl mx-auto p-4">
            {posts.map(post => (
                <Card key={post._id}>
                    <CardContent className="p-0">
                        {/* Post Header */}
                        <div className="p-4 pb-0 flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <img
                                    src={post.author?.profilePic || "https://www.w3schools.com/w3images/avatar3.png"}
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
                                    <p className="text-sm text-muted-foreground">{post.content}</p>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(post.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Follow button only for student */}
                                {currentUser?.role === "student" && post.author?.role === "alumni" && post.author._id !== currentUser._id && (
                                    <Button
                                        size="sm"
                                        className={`px-3 py-1 text-sm font-medium rounded-full ${following.includes(post.author._id)
                                            ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                                            : "bg-blue-500 text-white hover:bg-blue-600"
                                            }`}
                                        onClick={() => handleFollow(post.author._id)}
                                    >
                                        {following.includes(post.author._id) ? "Following" : "Follow"}
                                    </Button>
                                )}

                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Post Image */}
                        {post.image_url && (
                            <img
                                src={post.image_url}
                                alt="post"
                                className="w-full object-cover mt-2"
                            />
                        )}

                        <Separator className="my-2" />

                        {/* Engagement & Actions */}
                        <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{post.likes.length}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span>{post.comments.length} comments</span>
                            </div>
                        </div>

                        <Separator />

                        <div className="px-4 py-2 flex items-center justify-around">
                            {/* Like Button */}
                            <LikeButton
                                post={post}
                                setPosts={setPosts}
                                likeStatus={likeStatus}
                                setLikeStatus={setLikeStatus}
                            />

                            {/* Comment Button */}
                            <button
                                onClick={() => toggleComments(post._id)}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Comment</span>
                            </button>

                            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                <Repeat2 className="w-4 h-4" />
                                <span>Repost</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                <Send className="w-4 h-4" />
                                <span>Send</span>
                            </Button>
                        </div>

                        {/* Comment Section */}
                        {showComments[post._id] && (
                            <div className="mt-2 px-4">
                                <CommentsSection postId={post._id} />
                            </div>
                        )}
                    </CardContent>
                </Card>

            ))}


            {/* Floating + Button */}
            {currentUser?.role === "alumni" && (
                <button
                    onClick={() => setShowPopup(true)}
                    className="fixed bottom-6 right-6 bg-blue-500 text-white text-2xl px-4 py-2 rounded-full shadow-lg hover:bg-blue-600"
                >
                    +
                </button>
            )}


            {/* Popup for Creating Post */}
            {showPopup && currentUser?.role === "alumni" && (
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
