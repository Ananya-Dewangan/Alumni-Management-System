"use client";

import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // ✅ Added for animation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import campussetuLogo from "../../assets/campussetu-logo.png"; // ✅ Correct path

export default function RegisterForm({ onToggle }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    batch: "",
    role: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (formData.role === "admin") delete payload.batch;

      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        payload,
        { withCredentials: true }
      );
      console.log("✅ Registered:", res.data);
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Error registering");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-blue-200">
      {/* 🔹 Logo + Branding */}
      <div className="flex flex-col items-center mb-8">
        <motion.div
          className="relative"
          animate={{ y: [0, -6, 0] }} // slow floating
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* 🔹 Stronger initial glow pulse */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.2, 1] }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          <motion.img
            src={campussetuLogo}
            alt="CampusSetu Logo"
            className="relative w-28 h-28 object-contain bg-white rounded-full shadow-lg p-3 border border-gray-200"
          />
        </motion.div>

        <h1 className="mt-4 text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-700 text-transparent bg-clip-text drop-shadow-sm tracking-wide">
          CampusSetu
        </h1>
        <p className="text-gray-600 text-sm mt-1 font-medium">
          Bridge to Your Campus!
        </p>
      </div>

      {/* 🔹 Registration Card */}
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-lg border border-blue-200 shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold text-blue-700 mb-2">
            Create Account
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter Username"
                value={formData.username}
                onChange={handleChange}
                className="h-12 bg-white border-blue-300 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter Email"
                value={formData.email}
                onChange={handleChange}
                className="h-12 bg-white border-blue-300 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                className="h-12 bg-white border-blue-300 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-700 font-medium">
                Role
              </Label>
              <Select
                onValueChange={(value) => handleSelectChange("role", value)}
                required
              >
                <SelectTrigger className="h-12 bg-white border-blue-300 focus:ring-2 focus:ring-blue-500 text-gray-800">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-300 text-gray-700 shadow-md">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Batch Field */}
            {(formData.role === "student" || formData.role === "alumni") && (
              <div className="space-y-2">
                <Label htmlFor="batch" className="text-gray-700 font-medium">
                  Batch
                </Label>
                <Input
                  id="batch"
                  name="batch"
                  type="text"
                  placeholder="Enter Batch Year"
                  value={formData.batch}
                  onChange={handleChange}
                  className="h-12 bg-white border-blue-300 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
                  required
                />
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(to right, #4F46E5, #7C3AED, #9333EA)",
              }}
            >
              REGISTER
            </Button>
          </form>

          <div className="flex items-center justify-center space-x-2 text-gray-600 mt-5">
            <span>Already have an account?</span>
            <button
              type="button"
              onClick={onToggle}
              className="text-purple-600 font-medium hover:text-purple-500 underline"
            >
              Click here
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 🔹 Footer */}
      <p className="mt-8 text-gray-500 text-sm">
        © {new Date().getFullYear()} CampusSetu. All rights reserved.
      </p>
    </div>
  );
}
