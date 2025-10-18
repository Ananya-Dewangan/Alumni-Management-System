import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // alumni or student
  title: { type: String, required: true },
  content: { type: String, required: true },
  image_url: { type: String }, // optional for images
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      created_at: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
