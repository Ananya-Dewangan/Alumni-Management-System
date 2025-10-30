import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

export default function EditPostModal({ post, onClose, onUpdate }) {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(post?.image_url || "");
  const [loading, setLoading] = useState(false);

  // 🖼 Handle file input and preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Basic validation
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit!");
      return;
    }

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // 💾 Handle update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (imageFile) formData.append("image", imageFile);

      const res = await axios.put(
        `http://localhost:5000/api/posts/${post._id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.status === 200) {
        onUpdate(res.data); // ✅ Update parent post list
        onClose(); // ✅ Close modal
      }
    } catch (err) {
      console.error("❌ Error updating post:", err);
      alert("Failed to update post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative p-6">
        {/* ❌ Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Edit Post
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Title
            </label>
            <Input
              type="text"
              placeholder="Edit title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Content Field */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Content
            </label>
            <Textarea
              rows={4}
              placeholder="Edit your post content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Image
            </label>
            {preview && (
              <img
                src={preview}
                alt="Post Preview"
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
            )}
            <Input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
