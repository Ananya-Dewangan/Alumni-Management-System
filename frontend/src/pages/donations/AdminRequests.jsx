// frontend/src/pages/donations/AdminRequests.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import LinkedInHeader from "@/components/Linkedin-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Loader2, Image as ImageIcon, X, Trash2 } from "lucide-react";

export default function AdminRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetAmount: "",
    deadline: "",
    images: [],
  });

  // ==============================
  // FETCH REQUESTS
  // ==============================
  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/donation/requests",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      );

      const data = res.data?.requests || res.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching donation requests:", err);
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // CREATE REQUEST
  // ==============================
  async function createRequest(e) {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("targetAmount", Number(form.targetAmount));
      fd.append("deadline", form.deadline);

      form.images.forEach((file) => fd.append("images", file));

      await axios.post("http://localhost:5000/api/donation/request", fd, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      setForm({
        title: "",
        description: "",
        targetAmount: "",
        deadline: "",
        images: [],
      });

      fetchRequests();
    } catch (err) {
      console.error("Error creating donation request:", err);
      alert("Failed to create donation request.");
    }
  }

  // ==============================
  // CLOSE REQUEST
  // ==============================
  async function closeRequest(id) {
    try {
      await axios.patch(
        `http://localhost:5000/api/donation/request/${id}/close`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      );
      fetchRequests();
    } catch (err) {
      console.error("Error closing donation request:", err);
    }
  }

  // ==============================
  // DELETE REQUEST
  // ==============================
  async function deleteRequest(id) {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/donation/request/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      );
      fetchRequests();
    } catch (err) {
      console.error("Error deleting donation request:", err);
      alert("Failed to delete donation request.");
    }
  }

  // ==============================
  // IMAGE UPLOAD HANDLING
  // ==============================
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (i) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== i),
    }));
  };

  // ==============================
  // UI STARTS HERE
  // ==============================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-[#FDF2FA] to-[#F3F8FF]">
      <LinkedInHeader />

      <main className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <h2 className="text-4xl font-extrabold text-center mb-16 
          bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 
          bg-clip-text text-transparent drop-shadow-lg tracking-wide"
        >
          🎗 Donation Requests
        </h2>

        {/* CREATE CAMPAIGN */}
        <Card className="mb-20 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]
          bg-white/80 backdrop-blur-xl border border-purple-200/30 
          transition-all"
        >
          <CardContent className="p-10 space-y-6">
            <h3 className="text-2xl font-semibold text-indigo-700 mb-4">
              Create New Campaign
            </h3>

            <form onSubmit={createRequest} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  required
                  placeholder="Campaign Title"
                  className="rounded-2xl border-purple-300"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />

                <Input
                  required
                  type="number"
                  placeholder="Target Amount (₹)"
                  className="rounded-2xl border-purple-300"
                  value={form.targetAmount}
                  onChange={(e) =>
                    setForm({ ...form, targetAmount: e.target.value })
                  }
                />
              </div>

              <Textarea
                placeholder="Write a meaningful description..."
                className="rounded-2xl border-purple-300"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <Input
                type="date"
                className="rounded-2xl border-purple-300"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
              />

              {/* IMAGE UPLOAD */}
              <div>
                <label className="font-medium text-gray-600 flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  Upload Campaign Images
                </label>

                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="rounded-2xl border-purple-300"
                />

                {form.images.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-4">
                    {form.images.map((file, i) => (
                      <div
                        key={i}
                        className="relative w-32 h-32 rounded-2xl overflow-hidden 
                          shadow-md border border-purple-200 bg-white/90"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          className="object-cover w-full h-full"
                          alt=""
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-white p-1 rounded-full shadow"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="py-4 rounded-2xl text-lg font-semibold 
                bg-gradient-to-r from-indigo-500 to-purple-500 
                hover:opacity-90 shadow-xl text-white"
              >
                Create Campaign
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* EXISTING CAMPAIGNS */}
        <h3 className="text-3xl font-extrabold mb-16
          bg-gradient-to-r from-indigo-600 to-purple-900 
          bg-clip-text text-transparent drop-shadow-lg tracking-wide"
        >
          👉🏻 Existing Campaigns
        </h3>

        {loading ? (
          <div className="text-center py-10 text-gray-600 flex justify-center">
            <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading...
          </div>
        ) : requests.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {requests.map((r) => (
              <Card
                key={r._id}
                className="rounded-3xl bg-white/90 backdrop-blur-md 
                shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-purple-200/30 
                hover:shadow-purple-300/50 hover:-translate-y-1 hover:scale-[1.02] 
                transition-all"
              >
                <CardContent className="p-6 space-y-4">
                  <h4 className="text-xl font-bold text-indigo-700">
                    {r.title}
                  </h4>

                  <p className="text-gray-700 mt-1">{r.description}</p>

                  <div className="mt-2 text-lg font-semibold">
                    <span className="text-green-600">
                      ₹{r.collectedAmount || 0}
                    </span>
                    <span className="text-gray-700"> / ₹{r.targetAmount}</span>
                  </div>

                  <Badge
                    className={`rounded-xl px-3 py-1 ${
                      r.status === "active"
                        ? "bg-green-200 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {r.status}
                  </Badge>

                  {/* Images */}
                  {r.images?.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-3">
                      {r.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={`http://localhost:5000${img}`}
                          className="w-28 h-28 rounded-xl object-cover border"
                          alt=""
                        />
                      ))}
                    </div>
                  )}

                  {/* BUTTONS */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button
                      className="rounded-xl border border-blue-500 text-blue-600 hover:bg-blue-50"
                      onClick={() =>
                        navigate(`/admin/donations/${r._id}`)
                      }
                    >
                      Donation Details
                    </Button>

                    {r.status === "active" && (
                      <Button
                        onClick={() => closeRequest(r._id)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                      >
                        Close
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => deleteRequest(r._id)}
                      className="rounded-xl border border-gray-300 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 italic py-10">
            No donation requests found.
          </p>
        )}
      </main>
    </div>
  );
}