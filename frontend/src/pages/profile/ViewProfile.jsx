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

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    role: "",
    firstname: "",
    lastname: "",
    gender: "",
    course: "",
    department: "",
    bio: "",
    address: "",
    city: "",
    country: "",
    zipcode: "",
    linkedin_url: "",
    github_url: "",
    graduation_year: "",
    skills: [],
    profilePic: "",
    experience: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false);

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

  const handleDownloadPDF = async () => {
    const original = profileRef.current;
    if (!original) return;
    const clone = original.cloneNode(true);
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());
    clone.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("src")) img.setAttribute("src", getDefaultAvatar());
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
      pdf.save(`${profile.firstname || "Profile"}_${profile.lastname || ""}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      document.body.removeChild(clone);
    }
  };

  const handleDownloadExcel = () => {
    if (!profile) return;
    const data = [
      ["First Name", profile.firstname],
      ["Last Name", profile.lastname],
      ["Username", profile.username],
      ["Email", profile.email],
      ["Gender", profile.gender],
      ["Course", profile.course],
      ["Role", profile.role],
      ["Graduation Year", profile.graduation_year],
      ["Department", profile.department],
      ["Skills", profile.skills.join(", ")],
      ["Bio", profile.bio],
      ["Address", profile.address],
      ["City", profile.city],
      ["Country", profile.country],
      ["Zipcode", profile.zipcode],
      ["LinkedIn", profile.linkedin_url],
      ["GitHub", profile.github_url],
      ["Experience", profile.experience.map(e => `${e.jobTitle} at ${e.company}`).join("; ")],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profile Data");
    XLSX.writeFile(wb, `${profile.firstname || "Profile"}_${profile.lastname || ""}.xlsx`);
  };

  if (loading) return <p className="text-center mt-10 text-lg text-gray-600">Loading profile...</p>;
  if (error) return <p className="text-center mt-10 text-red-500 text-lg font-medium">{error}</p>;

  const socialLinks = [
    { url: profile.linkedin_url, label: "LinkedIn", color: "bg-blue-600" },
    { url: profile.github_url, label: "GitHub", color: "bg-gray-800" },
  ];

  return (
    <div className="min-h-screen flex justify-center items-start pt-16 bg-gradient-to-br from-blue-100 via-white to-indigo-200 p-4">
      <Card ref={profileRef} className="w-full max-w-4xl shadow-2xl rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-xl transition-all duration-300 hover:shadow-blue-200 hover:scale-[1.01]">
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
            <h2 className="text-3xl font-bold text-gray-800">{profile.firstname} {profile.lastname}</h2>
         <p className="text-blue-700 text-base font-bold">
  {profile.role
    ? `${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}${profile.company ? ` @ ${profile.company}` : ""}`
    : null}
</p>



          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
            <div className="bg-white/70 p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-blue-700 font-semibold mb-3 border-b border-blue-100 pb-2">Personal Info</h3>
              <p><strong>Username:</strong> {profile.username}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Gender:</strong> {profile.gender}</p>
              <p><strong>Bio:</strong> {profile.bio}</p>
          
            </div>

            <div className="bg-white/70 p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-blue-700 font-semibold mb-3 border-b border-blue-100 pb-2">Academic & Skills</h3>
              {/* <p><strong>Role:</strong> {profile.role}</p> */}
              <p><strong>Course:</strong> {profile.course}</p>
              <p><strong>Graduation Year:</strong> {profile.graduation_year}</p>
              <p><strong>Department:</strong> {profile.department}</p>
              <p><strong>Skills:</strong> {profile.skills.join(", ")}</p>
            </div>

            <div className="bg-white/70 p-5 rounded-2xl border border-gray-100 shadow-sm sm:col-span-2">
              <h3 className="text-blue-700 font-semibold mb-3 border-b border-blue-100 pb-2">Address Info</h3>
              <p><strong>Address:</strong> {profile.address}</p>
              <p><strong>City:</strong> {profile.city}</p>
              <p><strong>Country:</strong> {profile.country}</p>
              <p><strong>Zipcode:</strong> {profile.zipcode}</p>
            </div>

            {/* Experience */}
            {profile.experience.length > 0 && (
              <div className="bg-white/70 p-5 rounded-2xl border border-gray-100 shadow-sm sm:col-span-2">
                <h3 className="text-blue-700 font-semibold mb-3 border-b border-blue-100 pb-2">Experience</h3>
                {profile.experience.map((exp, idx) => (
                  <div key={idx} className="mb-3 border-b border-gray-200 pb-2">
                    <p><strong>{exp.jobTitle}</strong> at <strong>{exp.company}</strong></p>
                    <p>{exp.startMonth}/{exp.startYear} - {exp.currentlyWorking ? "Present" : `${exp.endMonth}/${exp.endYear}`}</p>
                    <p>{exp.city}, {exp.country} ({exp.locationType})</p>
                    {exp.description && <p>{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
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
                        className={`${link.color} text-white px-5 py-2 rounded-full shadow-md hover:opacity-90 transition-all`}
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
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 flex items-center gap-2"
              >
                ⬇ Download
              </button>
              {showMenu && (
                <div className="absolute bg-white border border-gray-200 shadow-lg rounded-xl mt-2 left-0 right-0 z-20">
                  <button onClick={() => { handleDownloadPDF(); setShowMenu(false); }} className="block w-full text-left px-6 py-2 hover:bg-blue-50 text-gray-700 rounded-t-xl">
                    📄 Download as PDF
                  </button>
                  <button onClick={() => { handleDownloadExcel(); setShowMenu(false); }} className="block w-full text-left px-6 py-2 hover:bg-green-50 text-gray-700 rounded-b-xl">
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
