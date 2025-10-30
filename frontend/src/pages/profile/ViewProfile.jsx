// src/pages/profile/ViewProfile.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

export default function ViewProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const profileRef = useRef();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false); // ✅ dropdown toggle state

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/auth/profile/${id}`,
          { withCredentials: true }
        );
        setProfile(response.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to fetch profile. Try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  // ✅ Simple avatars (no CORS)
  const femaleSvg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 24 24' fill='none'>
      <rect width='24' height='24' rx='12' fill='#FCE7F3'/>
      <circle cx='12' cy='8' r='4' fill='#F9A8D4'/>
      <path d='M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='#F9A8D4'/>
    </svg>
  `);

  const maleSvg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 24 24' fill='none'>
      <rect width='24' height='24' rx='12' fill='#DBEAFE'/>
      <circle cx='12' cy='8' r='4' fill='#60A5FA'/>
      <path d='M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='#60A5FA'/>
    </svg>
  `);

  const getDefaultAvatar = () =>
    profile?.gender?.toLowerCase() === "female"
      ? `data:image/svg+xml;utf8,${femaleSvg}`
      : `data:image/svg+xml;utf8,${maleSvg}`;

  // 🧾 PDF Download Function
  const handleDownloadPDF = async () => {
    const original = profileRef.current;
    if (!original) return;
    const clone = original.cloneNode(true);
    const noPrintInClone = clone.querySelectorAll(".no-print");
    noPrintInClone.forEach((el) => el.parentNode && el.parentNode.removeChild(el));

    const imgs = clone.querySelectorAll("img");
    imgs.forEach((img) => {
      if (!img.getAttribute("src")) {
        img.setAttribute("src", getDefaultAvatar());
      }
      img.setAttribute("crossOrigin", "anonymous");
    });

    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    document.body.appendChild(clone);

    try {
      await new Promise((res) => setTimeout(res, 200));
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      const filename = `${profile?.firstname || "Profile"}_${profile?.lastname || ""}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      document.body.removeChild(clone);
    }
  };

  // ✅ Excel Export Function
  const handleDownloadExcel = () => {
    if (!profile) return;
    const data = [
      ["First Name", profile.firstname || "N/A"],
      ["Last Name", profile.lastname || "N/A"],
      ["Username", profile.username || "N/A"],
      ["Email", profile.email || "N/A"],
      ["Gender", profile.gender || "N/A"],
      ["Job Title", profile.job_title || "N/A"],
      ["Company", profile.company || "N/A"],
      ["Role", profile.role || "N/A"],
      ["Graduation Year", profile.graduation_year || "N/A"],
      ["Department", profile.department || "N/A"],
      ["Skills", profile.skills?.join(", ") || "N/A"],
      ["Address", profile.address || "N/A"],
      ["City", profile.city || "N/A"],
      ["Country", profile.country || "N/A"],
      ["Zipcode", profile.zipcode || "N/A"],
      ["LinkedIn", profile.linkedin_url || "N/A"],
      ["GitHub", profile.github_url || "N/A"],
      ["Twitter", profile.twitter_url || "N/A"],
      ["Facebook", profile.facebook_url || "N/A"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profile Data");
    const filename = `${profile.firstname || "Profile"}_${profile.lastname || ""}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  if (loading)
    return <p className="text-center mt-10 text-lg text-gray-600">Loading profile...</p>;
  if (error)
    return <p className="text-center mt-10 text-red-500 text-lg font-medium">{error}</p>;
  if (!profile)
    return <p className="text-center mt-10 text-gray-600">Profile not found</p>;

  const socialLinks = [
    { url: profile.linkedin_url, label: "LinkedIn", color: "bg-blue-600" },
    { url: profile.github_url, label: "GitHub", color: "bg-gray-800" },
    { url: profile.twitter_url, label: "Twitter", color: "bg-sky-500" },
    { url: profile.facebook_url, label: "Facebook", color: "bg-blue-700" },
  ];

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-100 via-white to-indigo-200 p-6">
      <Card
        ref={profileRef}
        className="w-full max-w-3xl shadow-2xl rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-xl transition-all duration-300 hover:shadow-blue-200 hover:scale-[1.01]"
      >
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src={profile.profilePic || getDefaultAvatar()}
              alt="Profile"
              crossOrigin="anonymous"
              onError={(e) => (e.currentTarget.src = getDefaultAvatar())}
              className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white mb-3"
            />
            <h2 className="text-3xl font-bold text-gray-800">
              {profile.firstname} {profile.lastname}
            </h2>
            <p className="text-gray-500 text-base">
              {profile.job_title || "Professional"}{" "}
              {profile.company && `@ ${profile.company}`}
            </p>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
            <div className="bg-white/70 p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-blue-700 font-semibold mb-3 border-b border-blue-100 pb-2">
                Personal Info
              </h3>
              <p><strong>Username:</strong> {profile.username || "N/A"}</p>
              <p><strong>Email:</strong> {profile.email || "N/A"}</p>
              <p><strong>Gender:</strong> {profile.gender || "N/A"}</p>
              <p><strong>Bio:</strong> {profile.bio || "N/A"}</p>
            </div>

            <div className="bg-white/70 p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-blue-700 font-semibold mb-3 border-b border-blue-100 pb-2">
                Academic Info
              </h3>
              <p><strong>Role:</strong> {profile.role || "N/A"}</p>
              <p><strong>Graduation Year:</strong> {profile.graduation_year || "N/A"}</p>
              <p><strong>Department:</strong> {profile.department || "N/A"}</p>
              <p><strong>Skills:</strong> {profile.skills?.join(", ") || "N/A"}</p>
            </div>

            <div className="bg-white/70 p-5 rounded-2xl border border-gray-100 shadow-sm sm:col-span-2">
              <h3 className="text-blue-700 font-semibold mb-3 border-b border-blue-100 pb-2">
                Address Info
              </h3>
              <p><strong>Address:</strong> {profile.address || "N/A"}</p>
              <p><strong>City:</strong> {profile.city || "N/A"}</p>
              <p><strong>Country:</strong> {profile.country || "N/A"}</p>
              <p><strong>Zipcode:</strong> {profile.zipcode || "N/A"}</p>
            </div>
          </div>

          {/* Social Links */}
          {socialLinks.some((link) => link.url) && (
            <div className="text-center mt-8">
              <h3 className="text-blue-700 font-semibold mb-4">Social Links</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {socialLinks.map(
                  (link, idx) =>
                    link.url && (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`${link.color} social-btn text-white px-5 py-2 rounded-full shadow-md hover:opacity-90 transition-all`}
                      >
                        {link.label}
                      </a>
                    )
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-10 no-print relative">
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-full hover:bg-gray-300"
            >
              ← Back
            </button>

            {/* Unified Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 flex items-center gap-2"
              >
                ⬇ Download
              </button>
              {showMenu && (
                <div className="absolute bg-white border border-gray-200 shadow-lg rounded-xl mt-2 left-0 right-0 z-20">
                  <button
                    onClick={() => {
                      handleDownloadPDF();
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-6 py-2 hover:bg-blue-50 text-gray-700 rounded-t-xl"
                  >
                    📄 Download as PDF
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadExcel();
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-6 py-2 hover:bg-green-50 text-gray-700 rounded-b-xl"
                  >
                    📊 Export as Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
