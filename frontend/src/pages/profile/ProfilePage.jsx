import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Facebook, Twitter } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { LinkedInHeader } from "../../components/linkedin-header";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    role: "",
    firstname: "",
    lastname: "",
    gender: "",
    department: "",
    company: "",
    jobTitle: "",
    bio: "",
    address: "",
    city: "",
    country: "",
    zipcode: "",
    linkedin_url: "",
    twitter_url: "",
    facebook_url: "",
    github_url: "",
    graduation_year: "",
    skills: [],
    profilePic: "",
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showSkillPopup, setShowSkillPopup] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [refresh, setRefresh] = useState(false);

  // Handle input changes, including gender-based default profilePic
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
      profilePic:
        name === "gender" &&
        (!prev.profilePic ||
          prev.profilePic.includes("avatar3.png") ||
          prev.profilePic.includes("6997662.png"))
          ? value === "female"
            ? "https://cdn-icons-png.freepik.com/256/6997/6997662.png?semt=ais_white_label"
            : "https://www.w3schools.com/w3images/avatar3.png"
          : prev.profilePic,
    }));
  };

  // Add skill
  const handleAddSkill = () => {
    if (newSkill.trim() !== "" && !profile.skills.includes(newSkill.trim())) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
      setShowSkillPopup(false);
    }
  };

  // Delete skill
  const handleDeleteSkill = (index) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  // Update profile photo
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      setLoading(true);
      const res = await axios.put(
        "http://localhost:5000/api/profile/photo",
        formData,
        { withCredentials: true }
      );

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

  // Update profile details
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.put(
        "http://localhost:5000/api/profile/details",
        profile,
        { withCredentials: true }
      );

      const updatedData = res.data;

      const profilePic =
        !updatedData.profilePic ||
        updatedData.profilePic.includes("avatar3.png") ||
        updatedData.profilePic.includes("6997662.png")
          ? profile.gender === "female"
            ? "https://cdn-icons-png.freepik.com/256/6997/6997662.png?semt=ais_white_label"
            : "https://www.w3schools.com/w3images/avatar3.png"
          : updatedData.profilePic;

      setProfile({
        ...updatedData,
        gender: profile.gender,
        skills: Array.isArray(updatedData.skills)
          ? updatedData.skills
          : updatedData.skills
          ? updatedData.skills.split(",").map((s) => s.trim())
          : [],
        profilePic,
      });

      alert("Profile updated successfully!");
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error(err);
      alert("Error updating details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile
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

        const profileData = res.data;

        setProfile((prev) => ({
          ...prev,
          ...profileData,
          gender: profileData.gender || prev.gender || "",
          skills: Array.isArray(profileData.skills)
            ? profileData.skills
            : profileData.skills
            ? profileData.skills.split(",").map((s) => s.trim())
            : [],
          profilePic:
            profileData.profilePic ||
            (profileData.gender === "female"
              ? "https://cdn-icons-png.freepik.com/256/6997/6997662.png?semt=ais_white_label"
              : "https://www.w3schools.com/w3images/avatar3.png"),
        }));
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

  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInHeader />
      <form onSubmit={handleDetailsSubmit}>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT SECTION */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Edit Profile
                  </h2>

                  {/* USERNAME + EMAIL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        USERNAME
                      </label>
                      <Input value={profile.username} readOnly className="bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        EMAIL ADDRESS
                      </label>
                      <Input value={profile.email} readOnly className="bg-gray-100" />
                    </div>
                  </div>

                  {/* FIRST NAME + LAST NAME */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        FIRST NAME
                      </label>
                      <Input
                        name="firstname"
                        value={profile.firstname || ""}
                        onChange={handleChange}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        LAST NAME
                      </label>
                      <Input
                        name="lastname"
                        value={profile.lastname || ""}
                        onChange={handleChange}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  {/* DEPARTMENT (common for both Student & Alumni) */}
                  {(profile.role === "student" || profile.role === "alumni") && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        DEPARTMENT
                      </label>
                      <Input
                        name="department"
                        value={profile.department || ""}
                        onChange={handleChange}
                        placeholder="Enter your department"
                      />
                    </div>
                  )}

                  {/* COMPANY + JOB TITLE (only for Alumni) */}
                  {profile.role === "alumni" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                          COMPANY
                        </label>
                        <Input
                          name="company"
                          value={profile.company || ""}
                          onChange={handleChange}
                          placeholder="Enter your company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                          JOB TITLE
                        </label>
                        <Input
                          name="jobTitle"
                          value={profile.jobTitle || ""}
                          onChange={handleChange}
                          placeholder="Enter your job title"
                        />
                      </div>
                    </div>
                  )}

                  {/* GENDER */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      GENDER
                    </label>
                    <select
                      name="gender"
                      value={profile.gender || ""}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  {/* SKILLS */}
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    SKILLS
                  </label>
                  <div className="block w-full p-2 my-2 text-black border rounded">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.skills.map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-blue-500 text-white px-2 py-1 rounded-full text-sm gap-1"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSkill(index)}
                            className="bg-white text-blue-600 rounded-full w-4 h-4 flex items-center justify-center hover:bg-gray-200"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowSkillPopup(true)}
                        className="bg-gray-200 text-black px-2 py-1 rounded-full text-sm hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>

                    {/* Skill Popup */}
                    {showSkillPopup && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-4 rounded-lg shadow-lg w-80">
                          <h2 className="text-lg font-bold mb-2">Add a new skill</h2>
                          <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            className="border w-full p-2 mb-3"
                            placeholder="Enter skill"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowSkillPopup(false)}
                              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddSkill}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ADDRESS */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      ADDRESS
                    </label>
                    <Input
                      name="address"
                      value={profile.address || ""}
                      onChange={handleChange}
                      placeholder="Enter your address"
                    />
                  </div>

                  {/* CITY / COUNTRY / ZIP */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        CITY
                      </label>
                      <Input
                        name="city"
                        value={profile.city || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        COUNTRY
                      </label>
                      <Input
                        name="country"
                        value={profile.country || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        POSTAL CODE
                      </label>
                      <Input
                        name="zipcode"
                        value={profile.zipcode || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* SOCIAL LINKS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        LinkedIn URL
                      </label>
                      <Input
                        name="linkedin_url"
                        value={profile.linkedin_url || ""}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/yourname"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        GitHub URL
                      </label>
                      <Input
                        name="github_url"
                        value={profile.github_url || ""}
                        onChange={handleChange}
                        placeholder="https://github.com/yourname"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Twitter URL
                      </label>
                      <Input
                        name="twitter_url"
                        value={profile.twitter_url || ""}
                        onChange={handleChange}
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Facebook URL
                      </label>
                      <Input
                        name="facebook_url"
                        value={profile.facebook_url || ""}
                        onChange={handleChange}
                        placeholder="https://facebook.com/yourprofile"
                      />
                    </div>
                  </div>

                  {/* BIO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      ABOUT ME
                    </label>
                    <Textarea
                      name="bio"
                      value={profile.bio || ""}
                      onChange={handleChange}
                      placeholder="I am from XYZ batch, currently working as an SDE at ABC Firm"
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 mt-4 rounded"
                  >
                    Save Changes
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT SECTION */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm overflow-hidden">
                <div
                  className="h-32 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/city-skyline-urban-background.jpg')",
                  }}
                />
                <CardContent className="p-6 text-center relative">
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <img
                      src={profile.profilePic}
                      alt="Profile"
                      className="w-32 h-32 rounded-full cursor-pointer object-cover"
                      onClick={() =>
                        document.getElementById("fileInput").click()
                      }
                    />
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoChange}
                    />
                  </div>

                  <div className="mt-14">
                    <h3 className="text-xl font-semibold text-blue-500 mb-1">
                      {profile.username}
                    </h3>
                    <p className="text-gray-600 mb-1">
                      {profile.firstname} {profile.lastname}
                    </p>
                    <p className="text-gray-600 mb-1">
                      {profile.department}
                    </p>
                    {profile.role === "alumni" && (
                      <>
                        <p className="text-gray-600">{profile.company}</p>
                        <p className="text-gray-600 mb-4">
                          {profile.jobTitle}
                        </p>
                      </>
                    )}
                    <p className="text-gray-600 mb-4">
                      {profile.role
                        ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                        : ""}
                    </p>

                    <div className="text-sm text-gray-700 text-left mb-6">
                      {profile.bio || "No bio available."}
                    </div>

                    {/* SOCIAL ICONS */}
                    <div className="flex justify-center gap-4">
                      {profile.facebook_url && (
                        <a
                          href={profile.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center hover:bg-gray-400 cursor-pointer">
                            <Facebook className="w-4 h-4 text-gray-600" />
                          </div>
                        </a>
                      )}

                      {profile.twitter_url && (
                        <a
                          href={profile.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center hover:bg-gray-400 cursor-pointer">
                            <Twitter className="w-4 h-4 text-gray-600" />
                          </div>
                        </a>
                      )}

                      {profile.github_url && (
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center hover:bg-gray-400 cursor-pointer">
                            <img
                              src="github-mark.svg"
                              alt="GitHub"
                              className="w-4 h-4"
                            />
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
