// frontend/src/pages/post/Home.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { MainFeed } from "./main-feed"; // your existing MainFeed component
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Home() {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = loading, null = not logged in
  const [emailRequests, setEmailRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // 1) Fetch current user once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
        if (!mounted) return;
        setCurrentUser(res.data);
      } catch (err) {
        console.warn("No current user or auth/me failed:", err?.response?.status || err.message);
        if (!mounted) return;
        setCurrentUser(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 2) When currentUser becomes available and is admin, fetch email-change requests
  useEffect(() => {
    if (!currentUser) return; // null or undefined -> don't fetch
    if (currentUser.role !== "admin") return;

    let mounted = true;
    const fetchRequests = async () => {
      setRequestsLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/email-change-requests", { withCredentials: true });

        if (!mounted) return;

        const normalized = (res.data || []).map((r) => ({
          _id: r._id,
          user: r.user,
          currentEmail: r.currentEmail ?? r.oldEmail ?? r.current_email ?? "",
          requestedEmail: r.requestedEmail ?? r.newEmail ?? r.requested_email ?? "",
          reason: r.reason ?? "",
          status: r.status ?? "pending",
        }));

        setEmailRequests(normalized);
      } catch (err) {
        console.error("Failed to fetch email change requests:", err?.response?.data ?? err.message);
      } finally {
        if (mounted) setRequestsLoading(false);
      }
    };

    fetchRequests();
    return () => { mounted = false; };
  }, [currentUser]);

  // Approve / Deny handlers — call backend and remove item from UI on success
  const handleAction = async (id, action) => {
    try {
      await axios.put(
        `http://localhost:5000/api/email-change-requests/${id}`,
        { action },
        { withCredentials: true }
      );

      // remove from state
      setEmailRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(`${action} failed:`, err?.response?.data ?? err.message);
      alert(`Failed to ${action} request: ${err?.response?.data?.message || err?.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-6 py-6">
      {/* Main feed (center) spans 8 columns on large screens */}
      <div className="lg:col-span-8">
        <MainFeed />
      </div>

      {/* Right column (sidebar). On lg it will take 4 columns. Hidden on small screens */}
      <div className="hidden lg:block lg:col-span-4">
        {/* Show nothing while user data is loading */}
        {currentUser === undefined ? (
          <div className="p-4">Loading...</div>
        ) : currentUser?.role !== "admin" ? (
          // non-admins see nothing (keeps layout symmetric)
          <div className="p-4" />
        ) : (
          <Card className="p-4 shadow-lg rounded-2xl border border-gray-200 bg-white sticky top-6">
            <CardContent className="p-0">
              <h2 className="text-lg font-semibold mb-3">Email Change Requests</h2>

              {requestsLoading ? (
                <p className="text-sm text-gray-500">Loading requests...</p>
              ) : emailRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No pending requests.</p>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                  {emailRequests.map((r) => (
                    <div key={r._id} className="border rounded-md p-3 bg-gray-50">
                      <p className="font-medium text-sm">
                        {r.user?.firstname || r.user?.username || "Unknown User"}
                      </p>
                      <p className="text-xs text-gray-600">Current: {r.currentEmail}</p>
                      <p className="text-xs text-gray-600">Requested: {r.requestedEmail}</p>
                      {r.reason && <p className="text-xs text-gray-500 mt-1">Reason: {r.reason}</p>}

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAction(r._id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(r._id, "deny")}
                        >
                          Deny
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default Home;
