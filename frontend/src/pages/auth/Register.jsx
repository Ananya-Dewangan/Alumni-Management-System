"use client"

import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterForm({ onToggle }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    batch: "",
    role: "",
  })
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData,
        { withCredentials: true }
      )
      console.log("✅ Registered:", res.data)
      navigate("/profile") // redirect after success
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.msg || "Error registering")
    }
  }

  return (

    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="bg-blue-800/30 border-blue-600/50 backdrop-blur-sm max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white">Create Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="role" className="text-white/80">Role</Label>
              <Select onValueChange={(value) => handleSelectChange("role", value)} required>
                <SelectTrigger className="bg-blue-700/50 border-blue-600/50 text-white focus:border-coral-400">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-blue-800 border-blue-600">
                  <SelectItem value="student" className="text-white hover:bg-blue-700">Student</SelectItem>
                  <SelectItem value="alumni" className="text-white hover:bg-blue-700">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-white font-semibold text-lg"
              style={{ backgroundColor: "#FF6B6B" }}
            >
              REGISTER
            </Button>
          </form>

          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <span>Already have an account?</span>
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
    </div >
  )
}
