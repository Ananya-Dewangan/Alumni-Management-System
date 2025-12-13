// frontend/src/pages/donations/Contribute.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import LinkedInHeader from "@/components/Linkedin-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Heart, Download } from "lucide-react";
import { openMockPhonepe } from "@/utils/openMockPhonepe";

// ALWAYS send cookies
axios.defaults.withCredentials = true;

export default function Contribute() {
  const [campaigns, setCampaigns] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);

  // Fetch user + campaigns
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/auth/me")
      .then((res) => setUser(res.data))
      .catch((err) => console.error("User fetch error", err));

    fetchCampaigns();
    fetchMyDonations();
  }, []);

  async function fetchMyDonations() {
    try {
      const res = await axios.get("http://localhost:5000/api/donation/my");
      setDonations(res.data.donations || []);
    } catch (err) {
      console.error("My donations fetch error:", err);
    }
  }

  async function fetchCampaigns() {
    try {
      const res = await axios.get("http://localhost:5000/api/donation/requests");
      const data = res.data?.requests || res.data || [];
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  }

  // Create order (cookies sent automatically)
  async function createOrder(amount, requestId) {
    const res = await axios.post(
      "http://localhost:5000/api/donation/payment/order",
      { amount, requestId }
    );
    return res.data;
  }

  // Verify payment
  async function verifyPayment(payload) {
    return axios.post("http://localhost:5000/api/donation/payment/verify", payload);
  }

  function openPhonepeLike(amount, requestId) {
    if (!amount || amount <= 0) return alert("Enter valid amount");

    createOrder(amount, requestId)
      .then((orderRes) => {
        const fullName = user ? `${user.firstname} ${user.lastname}` : "Donor";

        openMockPhonepe({
          name: "Donation",
          description: "Complete your secure payment",
          amount,
          order_id: orderRes.orderId,
          userName: fullName,
          userEmail: user?.email || "",
          handler: async (response) => {
            try {
              await verifyPayment({
                orderId: response.orderId,
                requestId,
                amount,
                paymentId: response.paymentId,
                signature: response.signature,
              });
              alert("🎉 Donation successful!");
              fetchCampaigns();
              fetchMyDonations();
            } catch (err) {
              console.error("verify error", err);
              if (err.response) {
                console.error("verify response:", err.response.data);
              }
              alert("Payment verification failed.");
            }
          },
          onClose: () => console.log("PhonePe modal closed"),
        });
      })
      .catch((err) => {
        console.error("order create error", err);
        alert("Unable to start payment");
      });
  }

  const downloadReceipt = (id) => {
    window.open(`http://localhost:5000/api/donation/receipt/${id}`, "_blank");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mr-2" />
        <span className="text-sm font-medium tracking-wide text-slate-700">
          Loading donation campaigns...
        </span>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <LinkedInHeader />

      {/* PAGE WRAPPER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* TOP SECTION: Title + summary + quick stats */}
        <section className="mb-8 lg:mb-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 text-transparent bg-clip-text">
                Campus Impact
              </h2>
              <p className="mt-2 text-sm md:text-base text-slate-600 max-w-xl">
                Browse ongoing campaigns, donate securely, and manage your 
                contribution history with instant receipt downloads.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="hidden sm:flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 min-w-[160px]">
                <span className="font-semibold text-slate-900 text-sm">
                  {campaigns.length}
                </span>
                <span className="text-[11px] uppercase tracking-wide">
                  Active campaigns
                </span>
              </div>
              <div className="hidden sm:flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 min-w-[160px]">
                <span className="font-semibold text-slate-900 text-sm">
                  {donations.length}
                </span>
                <span className="text-[11px] uppercase tracking-wide">
                  My donations
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN GRID: campaigns left, sidebar right */}
        <section className="grid gap-8 lg:grid-cols-[1.7fr,1fr] items-start">
          {/* LEFT: Campaign list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Active Campaigns
              </h3>
              <span className="text-xs text-slate-500">
                Choose a campaign and enter the amount to donate.
              </span>
            </div>

            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm">
                <p className="text-center text-slate-500 italic">
                  No active campaigns at the moment.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {campaigns.map((c) => {
                  const progress =
                    c.targetAmount > 0
                      ? Math.min((c.collectedAmount / c.targetAmount) * 100, 100)
                      : 0;

                  return (
                    <Card
                      key={c._id}
                      className="group border border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-sky-200 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col"
                    >
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex-1 flex flex-col">
                          {c.images?.length > 0 && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-200">
                              <img
                                src={
                                  c.images[0].startsWith("http")
                                    ? c.images[0]
                                    : `http://localhost:5000${c.images[0]}`
                                }
                                alt="campaign"
                                className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                          )}

                          <h4 className="text-base font-semibold text-slate-900 mb-1 line-clamp-2">
                            {c.title}
                          </h4>
                          <p className="text-slate-600 text-xs mb-3 line-clamp-3">
                            {c.description}
                          </p>

                          <div className="text-xs mb-2 flex items-center justify-between">
                            <span className="font-semibold text-sky-600">
                              ₹{c.collectedAmount || 0}
                              <span className="text-[11px] text-slate-500 ml-1">
                                raised
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Goal: ₹{c.targetAmount}
                            </span>
                          </div>

                          <div className="mb-3">
                            <Progress
                              value={progress}
                              className="h-2 rounded-full bg-slate-100"
                            />
                            <p className="mt-1 text-[11px] text-slate-500 flex justify-between">
                              <span>{progress.toFixed(0)}% funded</span>
                              <span>
                                {c.deadline
                                  ? new Date(c.deadline).toLocaleDateString()
                                  : "No deadline"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                          <Input
                            type="number"
                            placeholder="Amount (₹)"
                            value={amounts[c._id] || ""}
                            onChange={(e) =>
                              setAmounts({
                                ...amounts,
                                [c._id]: e.target.value,
                              })
                            }
                            className="flex-1 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-sky-400 focus-visible:border-sky-400 text-sm"
                          />

                          <Button
                            onClick={() => {
                              const enteredAmount = Number(amounts[c._id]);
                              if (!enteredAmount || enteredAmount <= 0) {
                                alert("Enter valid amount");
                                return;
                              }
                              openPhonepeLike(enteredAmount, c._id);
                            }}
                            className="bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 hover:from-sky-400 hover:via-indigo-400 hover:to-fuchsia-400 text-white border border-sky-300/60 shadow-md shadow-sky-500/30 flex items-center gap-1 px-3 py-1.5 text-sm"
                          >
                            <Heart className="w-4 h-4 fill-white/80" />
                            Donate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: My Donations */}
          <aside className="space-y-4">
            <Card className="border border-slate-200 bg-slate-50/90 shadow-md rounded-2xl">
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-sky-100 text-sky-600 border border-sky-200">
                      <Heart className="w-4 h-4" />
                    </span>
                    My Donations
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {donations.length} total
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  View your previous contributions and download receipts anytime.
                </p>

                {donations.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">
                    No donations yet. Start by supporting a campaign on the left.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {donations.map((d) => (
                      <Card
                        key={d._id}
                        className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl"
                      >
                        <CardContent className="p-3.5">
                          <p className="font-semibold text-sm text-slate-900 line-clamp-1">
                            {d.requestId?.title}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-sky-600">₹{d.amount}</p>
                            <p className="text-[11px] text-slate-500">
                              {new Date(d.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(d.createdAt).toLocaleTimeString()}
                          </p>

                          <Button
                            onClick={() => downloadReceipt(d._id)}
                            className="mt-3 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-500 text-white w-full flex items-center justify-center gap-2 text-xs font-medium border border-emerald-300/60 py-2"
                          >
                            <Download className="w-4 h-4" />
                            Download receipt
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
}
