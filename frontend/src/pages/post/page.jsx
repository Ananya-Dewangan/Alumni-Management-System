import { LinkedInHeader } from "@/components/linkedin-header";
import { ProfileSidebar } from "./profile-sidebar";
import { MainFeed } from "./main-feed";
import RightSidebar from "./RightSidebar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LinkedInHeader />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ✅ Ensure three columns are always visible on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-3">
            <ProfileSidebar />
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6">
            <MainFeed />
          </div>

          {/* ✅ Right Sidebar */}
          <div className="lg:col-span-3 block">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}