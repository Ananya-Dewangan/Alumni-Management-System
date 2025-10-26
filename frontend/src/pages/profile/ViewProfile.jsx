// src/pages/profile/ViewProfile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function ViewProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/auth/profile/${id}`,
          { withCredentials: true }
        );
        setProfile(response.data);
        setError("");
      } catch (err) {
        console.error("Error fetching profile:", err.response || err.message);
        setError(err.response?.data?.msg || "Failed to fetch profile. Try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <p className="text-center mt-6">Loading profile...</p>;
  if (error) return <p className="text-center mt-6 text-red-500">{error}</p>;
  if (!profile) return <p className="text-center mt-6">Profile not found</p>;

  const socialLinks = [
    { url: profile.linkedin_url, label: "LinkedIn", color: "text-blue-700" },
    { url: profile.github_url, label: "GitHub", color: "text-gray-800" },
    { url: profile.twitter_url, label: "Twitter", color: "text-blue-500" },
    { url: profile.facebook_url, label: "Facebook", color: "text-blue-800" },
  ];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg shadow-xl p-6 rounded-2xl bg-white">
        <CardContent>
          <h2 className="text-2xl font-bold text-center mb-4">Profile Details</h2>

          <div className="space-y-2">
            {profile.profilePic && (
              <img
                src={profile.profilePic}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
            )}
            <p><strong>Username:</strong> {profile.username || "N/A"}</p>
            <p><strong>Full Name:</strong> {`${profile.firstname || ""} ${profile.lastname || ""}`}</p>
            <p><strong>Email:</strong> {profile.email || "N/A"}</p>
            <p><strong>Role:</strong> {profile.role || "N/A"}</p>
            <p><strong>Graduation Year:</strong> {profile.graduation_year || "N/A"}</p>
            <p><strong>Department:</strong> {profile.department || "N/A"}</p>
            <p><strong>Bio:</strong> {profile.bio || "N/A"}</p>
            <p><strong>Company:</strong> {profile.company || "N/A"}</p>
            <p><strong>Job Title:</strong> {profile.job_title || "N/A"}</p>
            <p><strong>Skills:</strong> {profile.skills?.length ? profile.skills.join(", ") : "N/A"}</p>
            <p><strong>Address:</strong> {profile.address || "N/A"}</p>
            <p><strong>City:</strong> {profile.city || "N/A"}</p>
            <p><strong>Country:</strong> {profile.country || "N/A"}</p>
            <p><strong>Zipcode:</strong> {profile.zipcode || "N/A"}</p>
            <p><strong>Gender:</strong> {profile.gender || "N/A"}</p>
            {/* <p><strong>About Me:</strong> {profile.aboutMe || "N/A"}</p> */}

            <div className="space-x-2 mt-2">
              {socialLinks.map(
                (link, idx) =>
                  link.url && (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`${link.color} underline`}
                    >
                      {link.label}
                    </a>
                  )
              )}
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors duration-200"
            >
              Back
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
