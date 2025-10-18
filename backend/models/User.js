import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstname: { type: String },
  lastname: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "alumni"], required: true },
  graduation_year: { type: Number },
  department: { type: String },
  bio: { type: String },
  company: { type: String },
  job_title: { type: String },
  skills: [String],
  city: { type: String },
  country: { type: String },
  zipcode: { type: String },
  linkedin_url: { type: String },
  github_url: { type: String },
  twitter_url: { type: String },
  facebook_url: { type: String },

  aboutMe: { type: String },
  profilePic: {
    type: String,
    default: "https://www.w3schools.com/w3images/avatar3.png" // default image URL
  },

  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

}, { timestamps: true });

export default mongoose.model("User", userSchema);
