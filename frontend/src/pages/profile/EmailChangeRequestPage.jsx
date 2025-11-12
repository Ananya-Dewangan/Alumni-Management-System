import React, { useState } from "react"; 
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LinkedInHeader } from "../../components/Linkedin-header";

export default function EmailChangeRequest() {
  const navigate = useNavigate();
  const [newEmail, setnewEmail] = useState(""); // UI state remains
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const emailTrimmed = newEmail.trim();

    // ✅ Validate input before sending
    if (!emailTrimmed) {
      setMessage("New email is required.");
      return;
    }

    // ✅ Optional: Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Payload key matches backend
      const payload = {
        newEmail: emailTrimmed,
        reason: reason.trim(),
      };

      console.log("Submitting payload:", payload);

      const res = await axios.post(
        "http://localhost:5000/api/email-change-requests",
        payload,
        { 
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );

      console.log("Server response:", res.data);

      setMessage("Request submitted successfully!");
      setnewEmail(""); // clear UI field
      setReason("");
    } catch (err) {
      console.error("Email change error:", err);
      console.error("Server response data:", err.response?.data);

      setMessage(
        err.response?.data?.message || "Failed to submit email change request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInHeader />

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg mt-8 p-6">
        <h1 className="text-2xl font-semibold text-center mb-4 text-purple-700">
          Request Email Change
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">New Email Address</label>
            <input
              type="email"
              placeholder="Enter new email"
              value={newEmail}
              onChange={(e) => setnewEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Reason (optional)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows="3"
              placeholder="Why do you want to change your email?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {message && (
            <div
              className={`text-sm text-center ${
                message.includes("success") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="text-purple-600 border-purple-600 hover:bg-purple-100"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}