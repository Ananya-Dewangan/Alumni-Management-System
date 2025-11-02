import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, GraduationCap } from "lucide-react";
import LinkedInLoadingScreen from "@/LinkedInLoadingScreen";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function ProfileSidebar() {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
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
  }, [navigate]);

  if (loading) return <LinkedInLoadingScreen />;

  return (
    <div className="sticky top-20 space-y-4"> {/* ✅ Fixed position */}
      <Card className="rounded-3xl overflow-hidden border border-gray-200 shadow-lg hover:shadow-2xl backdrop-blur-md bg-white/80 transition-all duration-300 transform hover:-translate-y-1">
        <CardContent className="p-0">
          {/* Header with Gradient */}
          <div className="h-28 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 relative">
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-50">
                <img
                  src={profile.profilePic || "/placeholder-kse4f.png"}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-14 pb-6 px-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {profile.firstname} {profile.lastname}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              @{profile.username || "alumni_user"}
            </p>

            <p className="text-sm text-gray-600 mb-3 italic leading-relaxed text-justify">
              {profile.bio || "No bio added yet."}
            </p>

            <div className="flex justify-center items-center text-gray-500 text-sm mb-2 gap-1">
              <MapPin size={14} />
              <span className="text-justify">
                {profile.city || "Unknown City"}, {profile.country || "Country"}
              </span>
            </div>

            <div className="flex justify-center items-center text-gray-500 text-sm gap-1">
              <GraduationCap size={14} />
              <span>Graduation Year: {profile.graduation_year || "N/A"}</span>
            </div>

            <Separator className="my-4" />

            {/* Skills Section */}
            {profile.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                  Skills
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {profile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full shadow-sm hover:shadow-md transition-all"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
