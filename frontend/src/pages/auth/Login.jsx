"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginForm({ onToggle }) {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Add login logic
    alert("Login submitted!");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-900/30 backdrop-blur-sm">
      <div className="bg-blue-800/40 border border-blue-600/50 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="bg-blue-700/50 border-blue-600/50 text-white placeholder:text-white/60 focus:border-coral-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="bg-blue-700/50 border-blue-600/50 text-white placeholder:text-white/60 focus:border-coral-400"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-white font-semibold text-lg bg-coral-400 hover:bg-coral-300 transition-colors rounded-lg"
          >
            LOGIN
          </Button>
        </form>

        <p className="mt-4 text-center text-gray-300">
          Don't have an account?{" "}
          <button onClick={onToggle} className="text-coral-400 hover:text-coral-300 underline">
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
