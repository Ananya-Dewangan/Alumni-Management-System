"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RegisterForm({ onToggle }) {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", batch: "", role: "" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSelectChange = (name, value) => setFormData({ ...formData, [name]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert("Register submitted!");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-900/30 backdrop-blur-sm">
      <div className="bg-blue-800/40 border border-blue-600/50 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white/80">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              className="bg-blue-700/50 border-blue-600/50 text-white placeholder:text-white/60 focus:border-coral-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
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
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              className="bg-blue-700/50 border-blue-600/50 text-white placeholder:text-white/60 focus:border-coral-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-white/80">Role</Label>
            <Select onValueChange={(value) => handleSelectChange("role", value)} required>
              <SelectTrigger className="bg-blue-700/50 border-blue-600/50 text-white focus:border-coral-400">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-blue-800 border-blue-600">
                <SelectItem value="student" className="text-white hover:bg-blue-700">Student</SelectItem>
                <SelectItem value="alumni" className="text-white hover:bg-blue-700">Alumni</SelectItem>
                <SelectItem value="admin" className="text-white hover:bg-blue-700">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.role === "student" || formData.role === "alumni") && (
            <div className="space-y-2">
              <Label htmlFor="batch" className="text-white/80">Batch</Label>
              <Input
                id="batch"
                name="batch"
                type="text"
                placeholder="Enter batch year"
                value={formData.batch}
                onChange={handleChange}
                className="bg-blue-700/50 border-blue-600/50 text-white placeholder:text-white/60 focus:border-coral-400"
                required
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-white font-semibold text-lg bg-coral-400 hover:bg-coral-300 transition-colors rounded-lg"
          >
            REGISTER
          </Button>
        </form>

        <p className="mt-4 text-center text-gray-300">
          Already have an account?{" "}
          <button onClick={onToggle} className="text-coral-400 hover:text-coral-300 underline">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
