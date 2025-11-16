import React, { useEffect, useState } from "react";
import axios from "axios";
import LinkedInHeader from "@/components/Linkedin-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Heart } from "lucide-react";

export default function Contribute() {
  const [campaigns, setCampaigns] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // 🟢 Fetch all active donation campaigns
  async function fetchCampaigns() {
    try {
      const res = await axios.get("http://localhost:5000/api/donation/requests", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        withCredentials: true,
      });

      const data = res.data?.requests || res.data || [];
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  }

  // 🟣 Create Razorpay order
  async function createOrder(amount, requestId) {
    const res = await axios.post(
      "http://localhost:5000/api/donation/payment/order",
      { amount, requestId },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        withCredentials: true,
      }
    );
    return res.data;
  }

  // 🟢 Verify Razorpay payment
  async function verifyPayment(payload) {
    return axios.post("http://localhost:5000/api/donation/payment/verify", payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      withCredentials: true,
    });
  }

  // 🟣 Open Razorpay Checkout
  function openRazorpay(amount, requestId) {
    if (!amount || amount <= 0) return alert("Enter a valid amount");

    createOrder(amount, requestId)
      .then((order) => {
        const options = {
          key: order.keyId || order.key,
          amount: order.amount,
          currency: "INR",
          name: "Alumni Donation",
          description: "Support your alumni community",
          order_id: order.orderId,
          handler: async function (response) {
            try {
              await verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                requestId,
                amount,
              });
              alert("🎉 Donation successful! Thank you for your support.");
              fetchCampaigns();
            } catch (err) {
              console.error("verify error", err);
              alert("Payment verification failed. Please contact admin.");
            }
          },
          theme: { color: "#6f42c1" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      })
      .catch((err) => {
        console.error("order create error", err);
        alert("Unable to start payment");
      });
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
        <span>Loading donation campaigns...</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <LinkedInHeader />

      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text mb-6">
          Support Alumni Causes ❤
        </h2>

        {campaigns.length === 0 ? (
          <p className="text-center text-gray-500 italic py-10">
            No active campaigns at the moment.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {campaigns.map((c) => {
              const progress =
                c.targetAmount > 0
                  ? Math.min((c.collectedAmount / c.targetAmount) * 100, 100)
                  : 0;

              return (
                <Card
                  key={c._id}
                  className="border hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-5 flex flex-col justify-between">
                    <div>
                      {/* 🖼 Campaign Image */}
                      {c.images?.length > 0 && (
                        <img
                          src={
                            c.images[0].startsWith("http")
                              ? c.images[0]
                              : `http://localhost:5000${c.images[0]}`
                          }
                          alt="campaign"
                          className="w-full h-48 object-cover rounded-md mb-4"
                        />
                      )}

                      {/* 🏷 Title & Desc */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {c.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {c.description}
                      </p>

                      {/* 💰 Progress */}
                      <div className="text-sm mb-2">
                        <span className="font-medium text-green-600">
                          ₹{c.collectedAmount || 0}
                        </span>{" "}
                        raised of ₹{c.targetAmount}
                      </div>

                      <Progress value={progress} className="mb-3" />

                      {/* 🗓 Deadline */}
                      <p className="text-xs text-gray-500">
                        Deadline:{" "}
                        {c.deadline
                          ? new Date(c.deadline).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>

                    {/* 💸 Donation Box */}
                    <div className="flex items-center gap-2 mt-4">
                      <Input
                        type="number"
                        placeholder="Enter amount (₹)"
                        value={amounts[c._id] || ""}
                        onChange={(e) =>
                          setAmounts({ ...amounts, [c._id]: e.target.value })
                        }
                        className="flex-1"
                      />

                      <Button
                        onClick={() =>
                          openRazorpay(Number(amounts[c._id] || 500), c._id)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                      >
                        <Heart className="w-4 h-4" />
                        Donate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
