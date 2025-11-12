import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import campussetuLogo from "../../assets/campussetu-logo.png";

export default function LoginForm({ onToggle }) {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    axios
      .post(
        "http://localhost:5000/api/auth/login",
        { identifier: form.identifier, password: form.password },
        { withCredentials: true }
      )
      .then((res) => {
        console.log(res.data.user);
        navigate("/home");
      })
      .catch(() => {
        setError("Invalid username or password. Please try again.");
      });
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-blue-200">
      {/* 🔹 Logo + App Branding */}
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

      {/* 🔹 Login Card */}
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-lg border border-blue-200 shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold text-blue-700 mb-2">
            Welcome Back!
          </CardTitle>
          {error && (
            <p className="text-red-500 text-sm font-medium text-center">
              {error}
            </p>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              name="identifier"
              placeholder="Email or Username"
              value={form.identifier}
              onChange={handleChange}
              className="h-12 bg-white border-blue-300 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="h-12 bg-white border-blue-300 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
              required
            />
            <Button
              type="submit"
              className="w-full h-12 text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(to right, #4F46E5, #7C3AED, #9333EA)",
              }}
            >
              LOG IN
            </Button>
          </form>

          <div className="flex items-center justify-center space-x-2 text-gray-600 mt-5">
            <span>Don’t have an account?</span>
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

      {/* 🔹 Footer tagline */}
      <p className="mt-8 text-gray-500 text-sm">
        © {new Date().getFullYear()} CampusSetu. All rights reserved.
      </p>
    </div>
  );
}
