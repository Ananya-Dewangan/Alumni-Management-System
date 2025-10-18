import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Logout from "../../pages/auth/Logout"
import { Search, ChevronDown, Facebook, Twitter } from "lucide-react"
import { Input } from "../../components/ui/input"
import { Card, CardContent } from "../../components/ui/card"
import { Textarea } from "../../components/ui/textarea"
import { useNavigate } from "react-router-dom";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { LinkedInHeader } from "../../components/linkedin-header";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    role: "",
    firstname: "",
    lastname: "",
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

  const [skillInput, setSkillInput] = useState("");

  // Add skill on Enter
  const [showPopup, setShowPopup] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    if (newSkill.trim() !== "") {
      const updatedSkills = [...profile.skills, newSkill.trim()];

      setProfile((prev) => ({
        ...prev,
        skills: updatedSkills,
      }));

      setNewSkill("");
      setShowPopup(false); // close popup
    }
  };

  // Handle text changes
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const [refresh, setRefresh] = useState(false);

  // Handle image selection
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
      setProfile(res.data);
      setRefresh((prev) => !prev); 
    } catch (err) {
      console.error(err);
      alert("Error updating photo");
    }
  };

  // Handle details selection
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.put(
        "http://localhost:5000/api/profile/details",
        {
          profile,
        },
        { withCredentials: true }
      );
      setProfile({
        ...res.data,
        skills: Array.isArray(res.data.skills)
          ? res.data.skills
          : res.data.skills
            ? res.data.skills.split(",").map((s) => s.trim())
            : [],
      });
      setRefresh((prev) => !prev); 
    } catch (err) {
      console.error(err);
      alert("Error updating details");
    }
  };

  // Fetch profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/profile", {
          withCredentials: true,
        });

        console.log(res.data);
        if (!res.data || !res.data.username) {
          navigate("/auth");
          return;
        }
        setProfile({
          ...res.data,
          skills: Array.isArray(res.data.skills)
            ? res.data.skills
            : res.data.skills
              ? res.data.skills.split(",").map((s) => s.trim())
              : [],
        });
      } catch (err) {
        console.error(err);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, refresh]);





  if (loading) {
    return <LinkedInLoadingScreen />;
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <LinkedInHeader />

      {/* Main Content */}
      <form onSubmit={handleDetailsSubmit}>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Edit Profile Form - Left Side */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Profile</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">USERNAME</label>
                      <Input value={profile.username} readOnly className="bg-gray-50" disable />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">EMAIL ADDRESS</label>
                      <Input value={profile.email} disable readOnly />
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-gray-500 mb-2">SKILLS</label>
                  <div className="block w-full p-2 my-2 text-black border rounded">
                    {/* Existing Skills */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}

                      {/* + Icon */}
                      <button
                        type="button"
                        onClick={() => setShowPopup(true)}
                        className="bg-gray-200 text-black px-2 py-1 rounded-full text-sm hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    {/* Popup for adding new skill */}
                    {showPopup && (
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
                              onClick={() => setShowPopup(false)}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">FIRST NAME</label>
                      <Input value={profile.firstname}
                        name="firstname"
                        onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">LAST NAME</label>
                      <Input value={profile.lastname}
                        name="lastname"
                        onChange={handleChange} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-2">ADDRESS</label>
                    <Input value={profile.address}
                      name="address"
                      onChange={handleChange} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">CITY</label>
                      <Input value={profile.city}
                        name="city"
                        onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">COUNTRY</label>
                      <Input value={profile.country}
                        name="country"
                        onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">POSTAL CODE</label>
                      <Input placeholder="ZIP Code" className="text-gray-400"
                        name="zipcode"
                        value={profile.zipcode}
                        onChange={handleChange} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">ABOUT ME</label>
                    <Textarea
                      value={profile.bio}
                      placeholder="I am from XYZ batch."
                      className="min-h-[100px] resize-none"
                      name="bio"
                      onChange={handleChange}
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

            {/* Profile Card - Right Side */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm overflow-hidden">
                {/* Banner Image */}
                <div
                  className="h-32 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('/city-skyline-urban-background.jpg')`,
                  }}
                />

                <CardContent className="p-6 text-center relative">
                  {/* Profile Picture */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <img
                      src={
                        profile.profilePic
                          ? profile.profilePic
                          : "https://www.w3schools.com/w3images/avatar3.png"
                      }
                      alt="Profile"
                      className="w-32 h-32 rounded-full cursor-pointer"
                      onClick={() => document.getElementById("fileInput").click()}
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
                    <h3 className="text-xl font-semibold text-blue-500 mb-1">{profile.username}</h3>
                    <p className="text-gray-600 mb-4">{profile.firstname} {profile.lastname}</p>
                    <p className="text-gray-600 mb-4">{profile.role}</p>
                    
                    <div className="text-sm text-gray-700 text-left mb-6">
                      {profile.bio || "No bio available."}
                    </div>

                    {/* Social Media Icons */}
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

                      {/* Twitter */}
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

                      {/* Google+ */}
                      {profile.github_url && (
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center hover:bg-gray-400 cursor-pointer">
                            <img src="github-mark.svg" alt="GitHub" className="w-4 h-4" />
                          </div>
                        </a>
                      )}

                    </div>
                  </div>

                  {/* Settings Icon */}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
