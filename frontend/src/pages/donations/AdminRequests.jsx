import React, { useEffect, useState } from "react";
import axios from "axios";
import LinkedInHeader from "@/components/Linkedin-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as ImageIcon, X, Trash2 } from "lucide-react";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetAmount: "",
    deadline: "",
    images: [],
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  // Fetch donation requests
  async function fetchRequests() {
    try {
      const res = await axios.get("http://localhost:5000/api/donation/requests", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        withCredentials: true,
      });

      const data = res.data?.requests || res.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching donation requests:", err);
    } finally {
      setLoading(false);
    }
  }

  // Create new donation request
  async function createRequest(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("targetAmount", Number(form.targetAmount));
      formData.append("deadline", form.deadline);

      form.images.forEach((file) => {
        formData.append("images", file);
      });

      await axios.post("http://localhost:5000/api/donation/request", formData, {
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

  // Close donation request
  async function closeRequest(id) {
    try {
      await axios.patch(
        `http://localhost:5000/api/donation/request/${id}/close`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          withCredentials: true,
        }
      );
      fetchRequests();
    } catch (err) {
      console.error("Error closing donation request:", err);
    }
  }

  // Delete donation request
  async function deleteRequest(id) {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/donation/request/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        withCredentials: true,
      });
      fetchRequests();
    } catch (err) {
      console.error("Error deleting donation request:", err);
      alert("Failed to delete donation request.");
    }
  }

  // Handle image upload
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...selectedFiles],
    }));
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <LinkedInHeader />

      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text mb-6">
          Donation Requests (Admin)
        </h2>

        {/* Create Campaign */}
        <Card className="mb-8 border shadow-sm">
          <CardContent className="p-6 space-y-5">
            <form onSubmit={createRequest} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  required
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <Input
                  type="number"
                  required
                  placeholder="Target Amount (₹)"
                  value={form.targetAmount}
                  onChange={(e) =>
                    setForm({ ...form, targetAmount: e.target.value })
                  }
                />
              </div>

              <Textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />

              {/* Upload Images */}
              <div>
                <label className="block font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" /> Upload Images
                </label>
                <Input type="file" multiple accept="image/*" onChange={handleFileChange} />

                {form.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {form.images.map((file, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-24 rounded-lg overflow-hidden border"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow hover:bg-gray-100"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Campaign
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Campaigns */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Existing Campaigns
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading requests...
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((r) => (
              <Card
                key={r._id}
                className="border hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{r.title}</h4>
                    <p className="text-sm text-gray-600">{r.description}</p>
                    <div className="mt-2 text-sm">
                      Collected:{" "}
                      <span className="font-medium text-green-600">
                        ₹{r.collectedAmount || 0}
                      </span>{" "}
                      / ₹{r.targetAmount}
                    </div>

                    <Badge
                      className={`mt-2 ${
                        r.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {r.status === "active" ? "Active" : "Closed"}
                    </Badge>

                    {r.images?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={`http://localhost:5000${img}`}
                            alt="donation"
                            className="w-24 h-24 object-cover rounded-md border"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {r.status === "active" && (
                      <Button
                        variant="destructive"
                        onClick={() => closeRequest(r._id)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Close
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => deleteRequest(r._id)}
                      className="border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
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
          <p className="text-gray-500 italic text-center py-10">
            No donation requests found.
          </p>
        )}
      </main>
    </div>
  );
}
