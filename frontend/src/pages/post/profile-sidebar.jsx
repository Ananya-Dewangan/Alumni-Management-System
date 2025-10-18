import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Bookmark, Users, FileText, Calendar } from "lucide-react"
import LinkedInLoadingScreen from "@/LinkedInLoadingScreen"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

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
    }, []);

    if (loading) {
        return <LinkedInLoadingScreen />;
    }

    return (
        <div className="space-y-4">
            {/* Profile Card */}
            <Card className="fixed w-80 left-32">
                <CardContent className="p-0">
                    {/* Cover Image */}
                    <div className="h-16 bg-gradient-to-r from-blue-600 to-blue-700 relative">
                        <div className="absolute -bottom-8 left-4">
                            <div className="w-16 h-16 rounded-full border-4 border-card bg-muted flex items-center justify-center">
                                <img
                                    src={profile.profilePic || "/placeholder-kse4f.png"}
                                    alt={profile.username}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        </div>
                    </div>


                    <div className="pt-10 px-4 pb-4">
                        <div className="mb-4">
                            <h2 className="font-bold text-zinc-800 text-xl">
                                {profile.firstname} {profile.lastname}
                            </h2>
                            <p className="text-base text-muted-foreground">
                                {profile.bio || "No bio added yet"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {profile.city} {profile.country}
                            </p>
                            <Separator className="my-4" />

                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-muted-foreground">
                                    Graduation Year: {profile.graduation_year || "N/A"}
                                </span>
                            </div>
                        </div>

                        <Separator className="my-4" />


                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
