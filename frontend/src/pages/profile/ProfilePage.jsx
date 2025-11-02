import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { LinkedInHeader } from "../../components/Linkedin-header";
import { Country, State, City } from "country-state-city";

export default function ProfilePage() {
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
  const navigate = useNavigate();
  const [showSkillPopup, setShowSkillPopup] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [refresh, setRefresh] = useState(false);

  // For "Add Experience" form (newExperience)
  const emptyExperience = {
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
  };
  const [newExperience, setNewExperience] = useState({ ...emptyExperience });

  // For country/state/city dropdowns in the "Add Experience" form
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Course → Department Mapping
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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i);

  // -------------------------
  // Main profile handlers
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "course") {
      setProfile((prev) => ({
        ...prev,
        course: value,
        department:
          value === "PhD" ? "Management and Engineering" : value === "MBA" ? [] : "",
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
  // Experience (existing entries) handlers
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
      experience: [
        ...prev.experience,
        {
          jobTitle: "",
          employmentType: "",
          company: "",
          isCurrent: false,
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
        },
      ],
    }));
  };

  const removeExperience = (index) => {
    setProfile((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
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
    // for now store file.name (you can implement upload later)
    handleExperienceChange(index, "media", file.name);
  };

  // -------------------------
  // Photo upload
  // -------------------------
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profilePic", file);
    try {
      setLoading(true);
      const res = await axios.put("http://localhost:5000/api/profile/photo", formData, {
        withCredentials: true,
      });
      setProfile((prev) => ({
        ...prev,
        profilePic: res.data.profilePic || prev.profilePic,
      }));
    } catch (err) {
      console.error(err);
      alert("Error updating photo");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Save whole profile details (Save Changes)
  // -------------------------
  const handleDetailsSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.put("http://localhost:5000/api/profile/details", profile, {
        withCredentials: true,
      });
      setProfile((prev) => ({ ...prev, ...res.data }));
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
  // Save experiences endpoint (separate)
  // -------------------------
  const handleSaveExperiences = async () => {
    try {
      setLoading(true);
      const res = await axios.put(
        "http://localhost:5000/api/profile/experience",
        { experience: profile.experience },
        { withCredentials: true }
      );
      if (res.data && res.data.experience) {
        setProfile((prev) => ({ ...prev, experience: res.data.experience }));
      }
      alert("Experiences saved successfully!");
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error(err);
      alert("Error saving experiences");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Fetch profile on mount
  // -------------------------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/profile", { withCredentials: true });
        if (!res.data || !res.data.username) {
          navigate("/auth");
          return;
        }
        const data = { ...res.data };
        if (!Array.isArray(data.experience)) data.experience = [];
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

  // -------------------------
  // Add-experience form handlers
  // -------------------------
  const handleNewExperienceChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setNewExperience((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      const file = files && files[0];
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
    } else {
      setNewExperience((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryChange = (e) => {
    const iso = e.target.value;
    const country = Country.getAllCountries().find((c) => c.isoCode === iso);
    setNewExperience((prev) => ({ ...prev, country: country ? country.name : "" }));
    if (iso) {
      const st = State.getStatesOfCountry(iso) || [];
      setStates(st);
      setCities([]);
      setNewExperience((prev) => ({ ...prev, state: "", city: "" }));
    } else {
      setStates([]);
      setCities([]);
      setNewExperience((prev) => ({ ...prev, state: "", city: "" }));
    }
  };

  const handleStateChange = (e) => {
    const isoState = e.target.value;
    setNewExperience((prev) => ({ ...prev, state: isoState }));
    const countryIso = Country.getAllCountries().find((c) => c.name === newExperience.country)?.isoCode;
    if (countryIso && isoState) {
      const cityList = City.getCitiesOfState(countryIso, isoState) || [];
      setCities(cityList);
      setNewExperience((prev) => ({ ...prev, city: "" }));
    } else {
      setCities([]);
      setNewExperience((prev) => ({ ...prev, city: "" }));
    }
  };

  const handleCityChange = (e) => {
    const ct = e.target.value;
    setNewExperience((prev) => ({ ...prev, city: ct }));
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

  const handleAddExperience = () => {
    if (!newExperience.jobTitle && !newExperience.company) {
      alert("Please add at least a job title or company.");
      return;
    }
    setProfile((prev) => ({ ...prev, experience: [...prev.experience, { ...newExperience }] }));
    setNewExperience({ ...emptyExperience });
    setStates([]);
    setCities([]);
  };

  // current experience for right column
  const currentExperience = profile.experience.find((exp) => exp.isCurrent || exp.currentlyWorking);

  // -------------------------
  // Skill handlers
  // -------------------------
  const handleAddSkill = () => {
    if (newSkill.trim() !== "" && !profile.skills.includes(newSkill.trim())) {
      setProfile((prev) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill("");
      setShowSkillPopup(false);
    }
  };

  const handleDeleteSkill = (index) => {
    setProfile((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInHeader />
      <form onSubmit={handleDetailsSubmit}>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT / MAIN SECTION */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">Edit Profile</h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input value={profile.username} readOnly className="bg-gray-100" />
                    <Input value={profile.email} readOnly className="bg-gray-100" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input name="firstname" value={profile.firstname} onChange={handleChange} placeholder="First name" />
                    <Input name="lastname" value={profile.lastname} onChange={handleChange} placeholder="Last name" />
                  </div>

                  {/* Course + Department (below first & last name) */}
                  {(profile.role === "student" || profile.role === "alumni") && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-500 mb-2">COURSE</label>
                        <select
                          name="course"
                          value={profile.course || ""}
                          onChange={handleChange}
                          className="w-full border rounded p-2"
                        >
                          <option value="">Select Course</option>
                          {courseOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {profile.course && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-500 mb-2">DEPARTMENT</label>
                          {profile.course === "MBA" ? (
                            <select
                              name="department"
                              multiple
                              value={profile.department || []}
                              onChange={handleChange}
                              className="w-full border rounded p-2"
                            >
                              {departmentOptions["MBA"].map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          ) : profile.course === "PhD" ? (
                            <Input value="Management and Engineering" readOnly className="bg-gray-100" />
                          ) : (
                            <select
                              name="department"
                              value={profile.department || ""}
                              onChange={handleChange}
                              className="w-full border rounded p-2"
                            >
                              <option value="">Select Department</option>
                              {(departmentOptions[profile.course] || []).map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">SKILLS</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.skills.map((skill, i) => (
                        <div key={i} className="flex items-center bg-blue-500 text-white px-2 py-1 rounded-full text-sm gap-1">
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSkill(i)}
                            className="bg-white text-blue-600 rounded-full w-4 h-4 flex items-center justify-center hover:bg-gray-200 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setShowSkillPopup(true)} className="bg-gray-200 text-black px-2 py-1 rounded-full text-sm hover:bg-gray-300">
                        +
                      </button>
                    </div>

                    {showSkillPopup && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-4 rounded-lg shadow-lg w-80">
                          <h2 className="text-lg font-bold mb-2">Add a new skill</h2>
                          <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className="border w-full p-2 mb-3" placeholder="Enter skill" />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setShowSkillPopup(false)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                            <button onClick={handleAddSkill} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Add</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address line */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Input name="address" value={profile.address} onChange={handleChange} placeholder="Address" />
                    <Input name="city" value={profile.city} onChange={handleChange} placeholder="City" />
                    <Input name="zipcode" value={profile.zipcode} onChange={handleChange} placeholder="Postal code" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input name="country" value={profile.country} onChange={handleChange} placeholder="Country" />
                    <select name="gender" value={profile.gender} onChange={handleChange} className="border rounded p-2">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  {/* Social links */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input name="linkedin_url" value={profile.linkedin_url} onChange={handleChange} placeholder="LinkedIn URL" />
                    <Input name="github_url" value={profile.github_url} onChange={handleChange} placeholder="GitHub URL" />
                  </div>

                  <Textarea name="bio" value={profile.bio} onChange={handleChange} placeholder="About me" className="min-h-[100px]" />

                  <div className="flex justify-end">
                    <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">Save Changes</button>
                  </div>
                </CardContent>
              </Card>

              {/* EXPERIENCE SECTION (editable entries + add form) */}
              {(profile.role === "student" || profile.role === "alumni") && (
                <Card className="shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-800">Experience</h2>
                      <div className="flex gap-2">
                        <button type="button" onClick={addExperience} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">+ Add Blank</button>
                        <button type="button" onClick={handleSaveExperiences} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Save Experiences</button>
                      </div>
                    </div>

                    {/* existing experiences */}
                    {profile.experience && profile.experience.length > 0 ? (
                      profile.experience.map((exp, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-white mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-700">Experience {index + 1}</h3>
                            <button type="button" onClick={() => removeExperience(index)} className="text-red-500 text-sm">Remove</button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3 mb-3">
                            <Input placeholder="Job Title" value={exp.jobTitle} onChange={(e) => handleExperienceChange(index, "jobTitle", e.target.value)} />
                            <Input placeholder="Company" value={exp.company} onChange={(e) => handleExperienceChange(index, "company", e.target.value)} />
                          </div>

                          <select value={exp.employmentType || ""} onChange={(e) => handleExperienceChange(index, "employmentType", e.target.value)} className="w-full border rounded p-2 mb-3">
                            <option value="">Employment Type</option>
                            {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>

                          <label className="flex items-center gap-2 mb-3">
                            <input type="checkbox" checked={!!exp.isCurrent} onChange={(e) => handleExperienceChange(index, "isCurrent", e.target.checked)} />
                            I am currently working in this role
                          </label>

                          <div className="grid md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                              <div className="flex gap-2">
                                <select value={exp.startMonth || ""} onChange={(e) => handleExperienceChange(index, "startMonth", e.target.value)} className="border rounded p-2 w-1/2">
                                  <option value="">Month</option>
                                  {months.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select value={exp.startYear || ""} onChange={(e) => handleExperienceChange(index, "startYear", e.target.value)} className="border rounded p-2 w-1/2">
                                  <option value="">Year</option>
                                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                              </div>
                            </div>

                            {!exp.isCurrent && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                <div className="flex gap-2">
                                  <select value={exp.endMonth || ""} onChange={(e) => handleExperienceChange(index, "endMonth", e.target.value)} className="border rounded p-2 w-1/2">
                                    <option value="">Month</option>
                                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                  <select value={exp.endYear || ""} onChange={(e) => handleExperienceChange(index, "endYear", e.target.value)} className="border rounded p-2 w-1/2">
                                    <option value="">Year</option>
                                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="grid md:grid-cols-3 gap-3 mb-3">
                            <select value={exp.country || ""} onChange={(e) => handleExperienceChange(index, "country", e.target.value)} className="border rounded p-2">
                              <option value="">Country</option>
                              {Country.getAllCountries().map((c) => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                            </select>

                            <select value={exp.state || ""} onChange={(e) => handleExperienceChange(index, "state", e.target.value)} className="border rounded p-2">
                              <option value="">State</option>
                              {State.getStatesOfCountry(Country.getAllCountries().find((c) => c.name === exp.country)?.isoCode || "").map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                            </select>

                            <select value={exp.city || ""} onChange={(e) => handleExperienceChange(index, "city", e.target.value)} className="border rounded p-2">
                              <option value="">City</option>
                              {City.getCitiesOfState(
                                Country.getAllCountries().find((c) => c.name === exp.country)?.isoCode || "",
                                State.getStatesOfCountry(Country.getAllCountries().find((c) => c.name === exp.country)?.isoCode || "").find((s) => s.name === exp.state)?.isoCode || ""
                              ).map((ct) => <option key={ct.name} value={ct.name}>{ct.name}</option>)}
                            </select>
                          </div>

                          <select value={exp.locationType || ""} onChange={(e) => handleExperienceChange(index, "locationType", e.target.value)} className="w-full border rounded p-2 mb-3">
                            <option value="">Location Type</option>
                            {locationTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>

                          <Textarea placeholder="Describe your role (max 200 chars)" maxLength={200} value={exp.description || ""} onChange={(e) => handleExperienceChange(index, "description", e.target.value)} className="mb-3" />

                          <div>
                            <label className="text-sm font-medium text-gray-500">Upload Media</label>
                            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif" onChange={(e) => handleMediaUpload(index, e.target.files[0])} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 text-sm">No experience added yet.</p>
                    )}

                    {/* Add Experience form (separate) */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-700 mb-3">Add Experience</h3>

                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                        <Input name="jobTitle" placeholder="Job Title" value={newExperience.jobTitle} onChange={handleNewExperienceChange} />
                        <Input name="company" placeholder="Company" value={newExperience.company} onChange={handleNewExperienceChange} />
                      </div>

                      <select name="employmentType" value={newExperience.employmentType} onChange={handleNewExperienceChange} className="w-full border rounded p-2 mb-3">
                        <option value="">Employment Type</option>
                        {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>

                      <label className="flex items-center gap-2 mb-3">
                        <input type="checkbox" name="currentlyWorking" checked={!!newExperience.currentlyWorking} onChange={handleNewExperienceChange} />
                        I am currently working in this role
                      </label>

                      <div className="grid md:grid-cols-4 gap-2 mb-3">
                        <select name="startMonth" value={newExperience.startMonth} onChange={handleNewExperienceChange} className="border rounded p-2">
                          <option value="">Start Month</option>
                          {months.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select name="startYear" value={newExperience.startYear} onChange={handleNewExperienceChange} className="border rounded p-2">
                          <option value="">Start Year</option>
                          {Array.from({ length: new Date().getFullYear() - 1970 + 1 }, (_, i) => 1970 + i).reverse().map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>

                        {!newExperience.currentlyWorking && (
                          <>
                            <select name="endMonth" value={newExperience.endMonth} onChange={handleNewExperienceChange} className="border rounded p-2">
                              <option value="">End Month</option>
                              {months.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select name="endYear" value={newExperience.endYear} onChange={handleNewExperienceChange} className="border rounded p-2">
                              <option value="">End Year</option>
                              {Array.from({ length: new Date().getFullYear() - 1970 + 1 }, (_, i) => 1970 + i).reverse().map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </>
                        )}
                      </div>

                      {/* Location dropdowns */}
                      <div className="grid md:grid-cols-3 gap-2 mb-3">
                        <select name="country" value={Country.getAllCountries().find((c) => c.name === newExperience.country)?.isoCode || ""} onChange={handleCountryChange} className="border rounded p-2">
                          <option value="">Country</option>
                          {Country.getAllCountries().map((c) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                        </select>

                        <select name="state" value={newExperience.state || ""} onChange={handleStateChange} className="border rounded p-2">
                          <option value="">State</option>
                          {states.map((s) => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                        </select>

                        <select name="city" value={newExperience.city || ""} onChange={handleCityChange} className="border rounded p-2">
                          <option value="">City</option>
                          {cities.map((ct) => <option key={ct.name} value={ct.name}>{ct.name}</option>)}
                        </select>
                      </div>

                      <select name="locationType" value={newExperience.locationType} onChange={handleNewExperienceChange} className="w-full border rounded p-2 mb-3">
                        <option value="">Location Type</option>
                        {locationTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>

                      <textarea name="description" maxLength={200} placeholder="Describe your role (max 200 characters)" value={newExperience.description} onChange={(e) => setNewExperience((prev) => ({ ...prev, description: e.target.value }))} className="w-full border rounded p-2 mb-3" />

                      <div className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">Upload Supporting Media</label>
                        <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif" onChange={handleFileUpload} />
                        <p className="text-xs text-gray-500 mt-1">Supported: PDF, PPT, DOC, JPG, PNG, GIF | Max size 100MB</p>
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={handleAddExperience} className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600">Add Experience</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT / PREVIEW SECTION */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm overflow-hidden">
                <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url('/city-skyline-urban-background.jpg')" }} />
                <CardContent className="p-6 text-center relative">
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <img
                      src={profile.profilePic || "/default-avatar.png"}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover cursor-pointer"
                      onClick={() => document.getElementById("fileInput")?.click()}
                    />
                    <input id="fileInput" type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                  </div>

                  <div className="mt-14 space-y-2">
                    <h3 className="text-xl font-semibold text-blue-500">{profile.username}</h3>
                    <p className="text-gray-600">{profile.firstname} {profile.lastname}</p>
                    <p className="text-gray-600">{profile.department}</p>

                    {currentExperience ? (
                      <>
                        <p className="text-gray-600">{currentExperience.company}</p>
                        <p className="text-gray-600">{currentExperience.jobTitle}</p>
                      </>
                    ) : null}

                    <p className="text-gray-600 capitalize">{profile.role}</p>
                    <p className="text-gray-700 text-sm">{profile.bio || "No bio available."}</p>

                    <div className="flex justify-center gap-4 pt-4">
                      {profile.github_url && (
                        <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                          <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center hover:bg-gray-400 cursor-pointer">
                            <img src="github-mark.svg" alt="GitHub" className="w-4 h-4" />
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}