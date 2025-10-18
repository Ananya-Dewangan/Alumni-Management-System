import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

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
        navigate("/profile");
      })
      .catch((err) => {
        setError("Invalid username or password. Please try again.");

      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md bg-blue-800/30 backdrop-blur-sm border-blue-600/30 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-white mb-4">
            Welcome Back!
          </CardTitle>
          {error && (
            <p className="text-red-400 text-sm font-medium text-center">
              {error}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {/* Error message */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              name="identifier"
              placeholder="Email or Username"
              value={form.identifier}
              onChange={handleChange}
              className="bg-blue-700/50 border-blue-600/50 text-white placeholder:text-blue-200 h-12"
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="bg-blue-700/50 border-blue-600/50 text-white placeholder:text-blue-200 h-12"
              required
            />
            <Button
              type="submit"
              className="w-full h-12 text-white font-semibold text-lg"
              style={{ backgroundColor: "#FF6B6B" }}
            >
              LOG IN
            </Button>
          </form>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={onToggle}
              className="text-coral-400 hover:text-coral-300 underline"
            >
              Click here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
