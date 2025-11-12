// /mnt/data/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { LinkedInHeader } from "../../components/Linkedin-header";
import { Country, State, City } from "country-state-city";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  // ---------- State ----------
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    role: "",
    firstname: "",
    lastname: "",
    contact_no: "",
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
  const [refresh, setRefresh] = useState(false);
  const [showSkillPopup, setShowSkillPopup] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newExperience, setNewExperience] = useState({
    jobTitle: "",
    employmentType: "",
    company: "",
    currentlyWorking: false,
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    country: "",
    state: "",
    city: "",
    locationType: "",
    description: "",
    media: null,
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showEmailRequest, setShowEmailRequest] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState("");
  const [requestReason, setRequestReason] = useState("");

  // keeps track of which experience indexes are expanded
  const [expanded, setExpanded] = useState([]); // array of indexes
  const navigate = useNavigate();

  // ---------- Constants ----------
  const courseOptions = ["B.Tech", "M.Tech", "MBA", "PhD"];
  const departmentOptions = {
    "B.Tech": [
      "Computer Science Engineering (CSE)",
      "Information Technology (IT)",
      "Electronic and Telecommunications (ET&T)",
      "CSE (Artificial Intelligence)",
      "CSE (Data Science)",
      "Civil Engineering",
      "Mechanical Engineering",
    ],
    "M.Tech": ["Structural Engineering", "CSE (AI & ML)", "Thermal Engineering"],
    "MBA": [
      "Marketing",
      "Finance",
      "Human Resource",
      "Systems",
      "Production and Operations Management",
    ],
    "PhD": ["Management and Engineering"],
  };

  const employmentTypes = [
    "Full-time",
    "Part-time",
    "Self-employed",
    "Freelance",
    "Internship",
    "Apprenticeship",
  ];
  const locationTypes = ["On-site", "Hybrid", "Remote"];
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const years = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i);

  // -------------------------
  // Main profile handlers
  // -------------------------
const sendEmailChangeRequest = async () => {
  try {
    if (!requestedEmail) return alert("Please provide the new email");
    await axios.post(
      "http://localhost:5000/api/email-change-requests",
      { requestedEmail, reason: requestReason },
      { withCredentials: true }
    );
    alert("Email change request sent to admin!");
    setShowEmailRequest(false);
    setRequestedEmail("");
    setRequestReason("");
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Error submitting request");
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "course") {
      setProfile((prev) => ({
        ...prev,
        course: value,
        department:
          value === "PhD"
            ? "Management and Engineering"
            : value === "MBA"
            ? []
            : "",
      }));
      return;
    }

    if (name === "department" && profile.course === "MBA") {
      const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
      setProfile((prev) => ({ ...prev, department: selected }));
      return;
    }

    if (name === "gender") {
      setProfile((prev) => ({
        ...prev,
        [name]: value,
        profilePic:
          !prev.profilePic ||
          prev.profilePic.includes("avatar3.png") ||
          prev.profilePic.includes("6997662.png")
            ? value === "female"
              ? "https://cdn-icons-png.freepik.com/256/6997/6997662.png?semt=ais_white_label"
              : "https://www.w3schools.com/w3images/avatar3.png"
            : prev.profilePic,
      }));
      return;
    }

    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------
  // Experience Handlers
  // -------------------------
  const handleExperienceChange = (index, field, value) => {
    setProfile((prev) => {
      const exp = [...prev.experience];
      exp[index] = { ...exp[index], [field]: value };
      return { ...prev, experience: exp };
    });
  };

  const addExperience = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [...prev.experience, { ...newExperience }],
    }));
    // expand the newly added one (index = old length)
    setExpanded((prev) => [...prev, profile.experience.length]);
  };

  const removeExperience = (index) => {
    setProfile((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
    // remove from expanded if present
    setExpanded((prev) => prev.filter((i) => i !== index));
  };

  const handleMediaUpload = (index, file) => {
    if (!file) return;
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file format.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      alert("File size exceeds 100MB limit.");
      return;
    }
    handleExperienceChange(index, "media", file.name);
  };

  // -------------------------
  // Photo upload / remove
  // -------------------------
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    // backend expects "photo" (upload.single("photo"))
    formData.append("photo", file);
    try {
      setLoading(true);
      const res = await axios.put("http://localhost:5000/api/profile/photo", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      // prefer res.data.photo (backend full URL) then res.data.profilePic, fallback to previous
      const newPic = (res.data && (res.data.photo || res.data.profilePic)) || "";
      if (newPic) {
        setProfile((prev) => ({
          ...prev,
          profilePic: newPic,
        }));
        alert("Profile photo updated successfully!");
      } else {
        // try other keys or keep previous
        setProfile((prev) => ({ ...prev }));
        alert("Upload completed but no photo URL returned.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating photo");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setLoading(true);
      const res = await axios.delete("http://localhost:5000/api/profile/photo", {
        withCredentials: true,
      });

      const defaultPic =
        profile.gender === "female"
          ? "https://cdn-icons-png.freepik.com/256/6997/6997662.png?semt=ais_white_label"
          : "https://www.w3schools.com/w3images/avatar3.png";

      setProfile((prev) => ({ ...prev, profilePic: defaultPic }));
      alert(res.data?.message || "Profile picture removed successfully!");
    } catch (err) {
      console.error(err);
      alert("Error removing profile picture");
    } finally {
      setLoading(false);
    }
  };


  // -------------------------
  // Save profile
  // -------------------------
  const handleDetailsSubmit = async (e) => {
    e?.preventDefault?.();

    try {
      setLoading(true);
      const payload = { ...profile };
      if (Array.isArray(payload.department)) {
        payload.department = payload.department.join(", ");
      }

      const res = await axios.put(
        "http://localhost:5000/api/profile/details",
        payload,
        { withCredentials: true }
      );

      const data = res.data || {};
      if (typeof data.department === "string" && data.department.includes(",")) {
        data.department = data.department.split(",").map((d) => d.trim());
      }

      setProfile((prev) => ({ ...prev, ...data }));
      alert("Profile updated successfully!");
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error(err);
      alert("Error updating details");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Fetch profile
  // -------------------------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/profile", {
          withCredentials: true,
        });

        if (!res.data || !res.data.username) {
          navigate("/auth");
          return;
        }

        const data = { ...res.data };
        if (data.department && typeof data.department === "string" && data.department.includes(",")) {
          data.department = data.department.split(",").map((d) => d.trim());
        }

        setProfile((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Error fetching profile:", err);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, refresh]);

  if (loading) return <LinkedInLoadingScreen />;

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
      setShowSkillPopup(false);
    }
  };

  const handleAddExperience = () => {
    if (!newExperience.jobTitle && !newExperience.company) {
      alert("Please add at least a job title or company.");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      experience: [...prev.experience, { ...newExperience }],
    }));

    // Reset the new experience form
    setNewExperience({
      jobTitle: "",
      employmentType: "",
      company: "",
      currentlyWorking: false,
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      country: "",
      state: "",
      city: "",
      locationType: "",
      description: "",
      media: null,
    });

    // Clear dependent dropdowns
    setStates([]);
    setCities([]);
  };


  const handleDeleteSkill = (index) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const currentExperience = profile.experience.find(
    (exp) => exp.isCurrent || exp.currentlyWorking
  );

  const handleNewExperienceChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setNewExperience((prev) => ({ ...prev, [name]: checked }));
    } else {
      setNewExperience((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryChange = (e) => {
    const iso = e.target.value;
    const country = Country.getAllCountries().find((c) => c.isoCode === iso);

    setNewExperience((prev) => ({
      ...prev,
      country: country ? country.name : "",
      state: "",
      city: "",
    }));

    // load states dynamically
    if (iso) {
      const stateList = State.getStatesOfCountry(iso) || [];
      setStates(stateList);
      setCities([]);
    } else {
      setStates([]);
      setCities([]);
    }
  };

  const handleStateChange = (e) => {
    const isoState = e.target.value;
    setNewExperience((prev) => ({ ...prev, state: isoState, city: "" }));

    const countryIso = Country.getAllCountries().find(
      (c) => c.name === newExperience.country
    )?.isoCode;

    if (countryIso && isoState) {
      const cityList = City.getCitiesOfState(countryIso, isoState) || [];
      setCities(cityList);
    } else {
      setCities([]);
    }
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setNewExperience((prev) => ({ ...prev, city: cityName }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file format.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("File size exceeds 100MB limit.");
      return;
    }

    setNewExperience((prev) => ({ ...prev, media: file }));
  };

  const handleSaveExperiences = async () => {
    try {
      setLoading(true);
      await axios.put(
        "http://localhost:5000/api/profile/experience",
        { experience: profile.experience },
        { withCredentials: true }
      );
      alert("Experiences saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving experiences");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Accordion helpers
  // -------------------------
  const isExpanded = (index) => expanded.includes(index);
  const toggleExpand = (index) => {
    setExpanded((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInHeader />

      <form onSubmit={handleDetailsSubmit}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ---------------- LEFT: Edit & Experience (main feed style) ---------------- */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Edit Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Edit Profile</h1>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg shadow-sm hover:from-cyan-600 hover:to-blue-600 transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>

              {/* Username + Email + Request Change */}
              <div className="mt-5 mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
                {/* Username */}
                <div className="flex-1">
                  <Input
                    value={profile.username}
                    readOnly
                    className="bg-gray-100"
                    placeholder="Username"
                  />
                </div>

                    {/* Email + Request Button */}
                    <div className="flex flex-1 items-center space-x-2">
                      {profile.role === "admin" ? (
                        <Input
                          name="email"
                          value={profile.email}
                          onChange={handleChange}
                          placeholder="Email"
                        />
                      ) : (
                        <>
                          <Input
                            value={profile.email}
                            readOnly
                            className="bg-gray-100"
                            placeholder="Email"
                          />
                          <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            type="button"
                            onClick={() => navigate("/email-change-request")}
                          >
                            Request Change
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="firstname" value={profile.firstname} onChange={handleChange} placeholder="First Name" />
                    <Input name="lastname" value={profile.lastname} onChange={handleChange} placeholder="Last name" />
                  </div>

                  {/* Add Contact No. for all roles */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="contact_no" value={profile.contact_no || ""} onChange={handleChange} placeholder="Contact Number" />
                  </div>

                  {/* course/dept */}
                  {(profile.role === "student" || profile.role === "alumni") && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Course</label>
                        <select
                          name="course"
                          value={profile.course || ""}
                          onChange={handleChange}
                          className="w-full border rounded-md p-2"
                        >
                          <option value="">Select Course</option>
                          {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Department</label>
                        {profile.course === "MBA" ? (
                          <select
                            name="department"
                            multiple
                            value={profile.department || []}
                            onChange={handleChange}
                            className="w-full border rounded-md p-2"
                          >
                            {departmentOptions["MBA"].map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : profile.course === "PhD" ? (
                          <Input value="Management and Engineering" readOnly className="bg-gray-100" />
                        ) : (
                          <select
                            name="department"
                            value={profile.department || ""}
                            onChange={handleChange}
                            className="w-full border rounded-md p-2"
                          >
                            <option value="">Select Department</option>
                            {(departmentOptions[profile.course] || []).map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* skills */}
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-2">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-500 text-white px-3 py-1 rounded-full text-sm hover:scale-105 transform transition">
                          <span>{s}</span>
                          <button type="button" className="font-bold" onClick={() => handleDeleteSkill(i)}>×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setShowSkillPopup(true)} className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm hover:bg-cyan-200 transition">+ Add Skill</button>
                    </div>

                    {showSkillPopup && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white w-80 p-5 rounded-xl shadow-lg border border-gray-200">
                          <h3 className="text-lg font-semibold text-cyan-700 mb-3">Add a new skill</h3>
                          <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className="w-full border rounded-md p-2 mb-3" placeholder="Skill name" />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setShowSkillPopup(false)} className="px-3 py-1 bg-gray-100 rounded-md">Cancel</button>
                            <button onClick={handleAddSkill} className="px-3 py-1 bg-cyan-600 text-white rounded-md">Add</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input name="address" value={profile.address} onChange={handleChange} placeholder="Address" />
                    <Input name="city" value={profile.city} onChange={handleChange} placeholder="City" />
                    <Input name="zipcode" value={profile.zipcode} onChange={handleChange} placeholder="Postal code" />
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="country" value={profile.country} onChange={handleChange} placeholder="Country" />
                    <select name="gender" value={profile.gender} onChange={handleChange} className="border rounded-md p-2">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="linkedin_url" value={profile.linkedin_url} onChange={handleChange} placeholder="LinkedIn URL" />
                    <Input name="github_url" value={profile.github_url} onChange={handleChange} placeholder="GitHub URL" />
                  </div>

                  <div className="mt-4">
                    <Textarea name="bio" value={profile.bio} onChange={handleChange} placeholder="About me" className="min-h-[90px]" />
                  </div>
                </div>
              </div>

              {/* Experience feed-style card */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Experience</h2>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={addExperience} className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-md hover:scale-105 transition">+ Blank</button>
                      <button type="button" onClick={handleSaveExperiences} className="px-3 py-1 bg-green-600 text-white rounded-md hover:scale-105 transition">Save Experiences</button>
                    </div>
                  </div>

                  {/* Existing experiences as accordion / feed items */}
                  <div className="mt-4 space-y-3">
                    {profile.experience && profile.experience.length > 0 ? (
                      profile.experience.map((exp, idx) => {
                        const title = exp.jobTitle || exp.company || `Experience ${idx + 1}`;

                        const subtitle = exp.company ? exp.company : "";
                        const dateRange = exp.isCurrent || exp.currentlyWorking
  ? `${exp.startMonth || ""} ${exp.startYear || ""} - Present`
  : `${exp.startMonth || ""} ${exp.startYear || ""}${exp.startYear ? " - " : ""}${exp.endMonth || ""} ${exp.endYear || ""}`;

                        return (
                          <div key={idx} className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleExpand(idx)}>
                              <div>
                                <div className="text-gray-800 font-semibold">{title}</div>
                                <div className="text-sm text-gray-500">{subtitle}</div>
                                <div className="text-xs text-gray-400 mt-1">{dateRange}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button type="button" onClick={(e) => { e.stopPropagation(); removeExperience(idx); }} className="text-red-500 text-sm hover:underline">Remove</button>
                                <div className="transform transition-transform duration-200" aria-hidden>
                                  {/* chevron */}
                                  <svg
  className={`w-5 h-5 ${isExpanded(idx) ? "rotate-180" : "rotate-0"}`}

                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Expandable content */}
                            <div
  className={`px-4 pb-4 transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isExpanded(idx) ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"}`}
>

                              <div className="grid md:grid-cols-2 gap-3 mt-3">
                                <Input placeholder="Job Title" value={exp.jobTitle} onChange={(e) => handleExperienceChange(idx, "jobTitle", e.target.value)} />
                                <Input placeholder="Company" value={exp.company} onChange={(e) => handleExperienceChange(idx, "company", e.target.value)} />
                                <select value={exp.employmentType || ""} onChange={(e) => handleExperienceChange(idx, "employmentType", e.target.value)} className="border rounded-md p-2">
                                  <option value="">Employment Type</option>
                                  {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>

                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={!!exp.isCurrent} onChange={(e) => handleExperienceChange(idx, "isCurrent", e.target.checked)} />
                                  <span className="text-sm text-gray-600">I am currently working in this role</span>
                                </label>
                              </div>

                              <div className="grid md:grid-cols-2 gap-3 mt-3">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                  <div className="flex gap-2">
                                    <select value={exp.startMonth || ""} onChange={(e) => handleExperienceChange(idx, "startMonth", e.target.value)} className="border rounded-md p-2 w-1/2">
                                      <option value="">Month</option>
                                      {months.map((m) => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select value={exp.startYear || ""} onChange={(e) => handleExperienceChange(idx, "startYear", e.target.value)} className="border rounded-md p-2 w-1/2">
                                      <option value="">Year</option>
                                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                  </div>
                                </div>

                                {!exp.isCurrent && (
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                    <div className="flex gap-2">
                                      <select value={exp.endMonth || ""} onChange={(e) => handleExperienceChange(idx, "endMonth", e.target.value)} className="border rounded-md p-2 w-1/2">
                                        <option value="">Month</option>
                                        {months.map((m) => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                      <select value={exp.endYear || ""} onChange={(e) => handleExperienceChange(idx, "endYear", e.target.value)} className="border rounded-md p-2 w-1/2">
                                        <option value="">Year</option>
                                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="grid md:grid-cols-3 gap-3 mt-3">
                                <select value={exp.country || ""} onChange={(e) => handleExperienceChange(idx, "country", e.target.value)} className="border rounded-md p-2">
                                  <option value="">Country</option>
                                  {Country.getAllCountries().map((c) => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                                </select>

                                <select value={exp.state || ""} onChange={(e) => handleExperienceChange(idx, "state", e.target.value)} className="border rounded-md p-2">
                                  <option value="">State</option>
                                  {State.getStatesOfCountry(Country.getAllCountries().find((c) => c.name === exp.country)?.isoCode || "").map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                                </select>

                                <select value={exp.city || ""} onChange={(e) => handleExperienceChange(idx, "city", e.target.value)} className="border rounded-md p-2">
                                  <option value="">City</option>
                                  {City.getCitiesOfState(
                                    Country.getAllCountries().find((c) => c.name === exp.country)?.isoCode || "",
                                    State.getStatesOfCountry(Country.getAllCountries().find((c) => c.name === exp.country)?.isoCode || "").find((s) => s.name === exp.state)?.isoCode || ""
                                  ).map((ct) => <option key={ct.name} value={ct.name}>{ct.name}</option>)}
                                </select>
                              </div>

                              <div className="mt-3">
                                <select value={exp.locationType || ""} onChange={(e) => handleExperienceChange(idx, "locationType", e.target.value)} className="w-full border rounded-md p-2">
                                  <option value="">Location Type</option>
                                  {locationTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>

                              <div className="mt-3">
                                <Textarea placeholder="Describe your role (max 200 chars)" maxLength={200} value={exp.description || ""} onChange={(e) => handleExperienceChange(idx, "description", e.target.value)} />
                              </div>

                              <div className="mt-3">
                                <label className="block text-sm text-gray-600 mb-1">Upload Media</label>
                                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif" onChange={(e) => handleMediaUpload(idx, e.target.files[0])} />
                                {exp.media && <div className="text-xs text-gray-500 mt-1">Uploaded: {exp.media}</div>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : <div className="text-gray-500 text-sm">No experience added yet. Use <span className="font-medium">+ Blank</span> or the "Add Experience" form below.</div>}
                  </div>
                </div>

                {/* Add Experience Card (feed-style) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Add Experience</h3>

                  <div className="grid md:grid-cols-2 gap-3">
                    <Input name="jobTitle" placeholder="Job Title" value={newExperience.jobTitle} onChange={handleNewExperienceChange} />
                    <Input name="company" placeholder="Company" value={newExperience.company} onChange={handleNewExperienceChange} />
                  </div>

                  <div className="mt-3">
                    <select name="employmentType" value={newExperience.employmentType} onChange={handleNewExperienceChange} className="w-full border rounded-md p-2">
                      <option value="">Employment Type</option>
                      {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 mt-3">
                    <input type="checkbox" name="currentlyWorking" checked={!!newExperience.currentlyWorking} onChange={handleNewExperienceChange} />
                    <span className="text-sm">I am currently working in this role</span>
                  </label>

                  <div className="grid md:grid-cols-4 gap-2 mt-3">
                    <select name="startMonth" value={newExperience.startMonth} onChange={handleNewExperienceChange} className="border rounded-md p-2">
                      <option value="">Start Month</option>
                      {months.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select name="startYear" value={newExperience.startYear} onChange={handleNewExperienceChange} className="border rounded-md p-2">
                      <option value="">Start Year</option>
                      {Array.from({ length: new Date().getFullYear() - 1970 + 1 }, (_, i) => 1970 + i).reverse().map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>

                    {!newExperience.currentlyWorking && (
                      <>
                        <select name="endMonth" value={newExperience.endMonth} onChange={handleNewExperienceChange} className="border rounded-md p-2">
                          <option value="">End Month</option>
                          {months.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select name="endYear" value={newExperience.endYear} onChange={handleNewExperienceChange} className="border rounded-md p-2">
                          <option value="">End Year</option>
                          {Array.from({ length: new Date().getFullYear() - 1970 + 1 }, (_, i) => 1970 + i).reverse().map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-2 mt-3">
                    <select name="country" value={Country.getAllCountries().find((c) => c.name === newExperience.country)?.isoCode || ""} onChange={handleCountryChange} className="border rounded-md p-2">
                      <option value="">Country</option>
                      {Country.getAllCountries().map((c) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                    </select>

                    <select name="state" value={newExperience.state || ""} onChange={handleStateChange} className="border rounded-md p-2">
                      <option value="">State</option>
                      {states.map((s) => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                    </select>

                    <select name="city" value={newExperience.city || ""} onChange={handleCityChange} className="border rounded-md p-2">
                      <option value="">City</option>
                      {cities.map((ct) => <option key={ct.name} value={ct.name}>{ct.name}</option>)}
                    </select>
                  </div>

                  <div className="mt-3">
                    <select name="locationType" value={newExperience.locationType} onChange={handleNewExperienceChange} className="w-full border rounded-md p-2">
                      <option value="">Location Type</option>
                      {locationTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="mt-3">
                    <textarea name="description" maxLength={200} placeholder="Describe your role (max 200 characters)" value={newExperience.description} onChange={(e) => setNewExperience((prev) => ({ ...prev, description: e.target.value }))} className="w-full border rounded-md p-2" />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-1">Upload Supporting Media</label>
                    <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif" onChange={handleFileUpload} />
                    <p className="text-xs text-gray-500 mt-1">Supported: PDF, PPT, DOC, JPG, PNG, GIF | Max size 100MB</p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={handleAddExperience} className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-md hover:scale-105 transition">Add Experience</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- RIGHT: Profile Preview (feed sidebar) ---------------- */}
            <div className="space-y-4 ">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                <div className="h-28 bg-gradient-to-r from-blue-500 to-purple-500 " />

                <div className="p-6 text-center relative">
                  <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 group">
                    <div className="relative">
                      <img
                        src={profile.profilePic || "https://www.w3schools.com/w3images/avatar3.png"}
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                        onClick={() => document.getElementById("fileInput")?.click()}
                      />

                      {/* hover overlay (pencil & trash icons) */}
                      <div className="absolute inset-0 rounded-full bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById("fileInput")?.click()}
                          title="Edit photo"
                          className="bg-white p-2 rounded-full hover:bg-cyan-500 hover:text-white transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          title="Delete photo"
                          className="bg-white p-2 rounded-full hover:bg-red-500 hover:text-white transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <input id="fileInput" type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                  </div>

                  <div className="mt-16 space-y-1">
                    <div className="text-lg font-semibold text-gray-800">{profile.username}</div>
                    <div className="text-sm text-gray-600">{profile.firstname} {profile.lastname}</div>
                    <div className="text-sm text-gray-500">
                      {Array.isArray(profile.department) ? profile.department.join(", ") : profile.department}
                    </div>
                    {currentExperience && (
                      <div className="text-sm text-gray-600 mt-1">
                        {currentExperience.jobTitle} @ {currentExperience.company}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2 italic text-justify">
               {profile.bio || "No bio available."}
                </div>

                    <div className="mt-3 flex justify-center gap-3">
                      {profile.github_url && (
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition"
                        >
                          <img src="/github-mark.svg" alt="GitHub" className="w-4 h-4" />
                        </a>
                      )}

                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition"
                        >
                          {/* LinkedIn blue icon */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 text-[#0077B5]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M4.98 3.5a2.5 2.5 0 11-.001 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.7v1.64h.05c.52-.98 1.8-2 3.7-2 4 0 4.7 2.63 4.7 6.05V21h-4v-5.22c0-1.25-.02-2.86-1.74-2.86-1.75 0-2.02 1.37-2.02 2.78V21H9V9z" />
                          </svg>
                        </a>
                      )}
                    </div>

                    <div className="mt-3">
                      {/* small info removed - actions via overlay now */}
                    </div>
                  </div>
                </div>
              </div>

              {/* small stats / quick info card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                <div className="text-sm text-gray-600">Role</div>
                <div className="text-md font-semibold text-gray-800 capitalize">{profile.role || "—"}</div>
                <div className="mt-3 text-sm text-gray-600">Skills</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.skills.slice(0, 6).map((s, i) => (
                    <span key={i} className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}