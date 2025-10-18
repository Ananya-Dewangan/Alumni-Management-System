import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    company: { type: String, required: true },
    location: { type: String },
    posted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date_posted: { type: Date, default: Date.now }
  }, { timestamps: true });
  
  export default mongoose.model("Job", jobSchema);
  