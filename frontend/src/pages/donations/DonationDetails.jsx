// frontend/src/pages/donations/DonationDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Navigate } from "react-router-dom";
import LinkedInHeader from "@/components/Linkedin-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Heart, Users, Download, Calendar, Image as ImageIcon, Trash2, X } from "lucide-react";

export default function DonationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [closing, setClosing] = useState(false);

  // Check auth first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true
        });
        setUser(res.data);
        setIsAdmin(res.data?.role === 'admin');
      } catch (err) {
        console.error("Auth check failed:", err);
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch details if admin and ID present
  useEffect(() => {
    if (id && isAdmin) {
      fetchDetails();
    }
  }, [id, isAdmin]);

    async function fetchDetails() {
    try {
        setLoading(true);
        
        // 1. Fetch single campaign details directly
        const requestRes = await axios.get(`http://localhost:5000/api/donation/requests`, {
        withCredentials: true
        });
        
        const campaign = requestRes.data.requests?.find(r => r._id === id);
        setRequest(campaign);

        // 2. Fetch ALL donations for this campaign (admin endpoint)
        const donationsRes = await axios.get(`http://localhost:5000/api/donation/admin/${id}/donations`, {
        withCredentials: true
        });
        
        setDonations(donationsRes.data.donations || []);
    } catch (err) {
        console.error("Error fetching details:", err);
        // Fallback to /my if admin endpoint fails
        try {
        const fallbackRes = await axios.get(`http://localhost:5000/api/donation/my`, {
            withCredentials: true
        });
        setDonations(fallbackRes.data.donations?.filter(d => d.requestId?._id === id) || []);
        } catch (fallbackErr) {
        console.error("Fallback donations fetch failed:", fallbackErr);
        }
    } finally {
        setLoading(false);
    }
    }


  // Close campaign
  async function closeCampaign() {
    if (!window.confirm("Close this campaign? Donations will stop.")) return;
    
    try {
      setClosing(true);
      await axios.patch(`http://localhost:5000/api/donation/request/${id}/close`, {}, {
        withCredentials: true
      });
      setRequest(prev => ({ ...prev, status: 'closed' }));
      alert("Campaign closed successfully!");
    } catch (err) {
      console.error("Close failed:", err);
      alert("Failed to close campaign");
    } finally {
      setClosing(false);
    }
  }

  // Not admin or loading
  if (!isAdmin && !loading) {
    return <Navigate to="/home" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-[#FDF2FA] to-[#F3F8FF]">
        <LinkedInHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mr-3" />
          <span className="text-xl text-gray-600">Loading campaign details...</span>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-[#FDF2FA] to-[#F3F8FF]">
        <LinkedInHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">The donation campaign you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/admin/donations")} className="rounded-2xl">
            ← Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  const progress = request.targetAmount > 0 
    ? Math.min((request.collectedAmount / request.targetAmount) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-[#FDF2FA] to-[#F3F8FF]">
      <LinkedInHeader />
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* CAMPAIGN HEADER */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-purple-200/30 p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Images */}
            <div className="flex-1 min-w-0">
              {request.images?.[0] && (
                <img
                  src={`http://localhost:5000${request.images[0]}`}
                  className="w-full lg:w-96 h-80 object-cover rounded-2xl shadow-2xl mb-6"
                  alt={request.title}
                />
              )}
              
              {/* More images carousel */}
              {request.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {request.images.slice(1).map((img, idx) => (
                    <img
                      key={idx}
                      src={`http://localhost:5000${img}`}
                      className="w-24 h-24 object-cover rounded-xl flex-shrink-0 border-2 border-purple-200"
                      alt=""
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
                  {request.title}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">{request.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-3xl">💰</div>
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{request.collectedAmount || 0}
                    </span>
                    <span className="text-lg text-gray-500">raised of</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ₹{request.targetAmount}
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-gray-500 mt-1">{Math.round(progress)}% funded</p>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg">
                    {request.status.toUpperCase()}
                  </Badge>
                  {request.deadline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Ends {new Date(request.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => navigate("/admin/donations")}
                  className="rounded-2xl flex-1"
                  variant="outline"
                >
                  ← Back to Campaigns
                </Button>
                {request.status === "active" && (
                  <Button 
                    onClick={closeCampaign}
                    disabled={closing}
                    className="rounded-2xl bg-red-500 hover:bg-red-600 text-white" 
                  >
                    {closing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {closing ? "Closing..." : "Close Campaign"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* DONATIONS TABLE */}
        <Card className="rounded-3xl shadow-xl border border-purple-200/30">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <Users className="w-7 h-7 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Donations ({donations.length})
              </h2>
            </div>

            {donations.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full">
                <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <th className="p-4 text-left font-semibold text-gray-800">Donor</th>
                    <th className="p-4 text-left font-semibold text-gray-800">Amount</th>
                    <th className="p-4 text-left font-semibold text-gray-800">Date</th>
                    <th className="p-4 text-left font-semibold text-gray-800">Payment ID</th>
                    <th className="p-4 text-center font-semibold text-gray-800">Receipt</th>
                    </tr>
                </thead>
                <tbody>
                    {donations.map((d) => (
                    <tr key={d._id} className="border-t hover:bg-gray-50">
                        <td className="p-4 font-medium">
                        {d.donorId?.firstname || d.donorId?.name || "Anonymous"}
                        {d.donorId?.lastname && ` ${d.donorId.lastname}`}
                        <div className="text-sm text-gray-500">
                            {d.donorId?.email || d.donorId?.username || d.donorId?.phone}
                        </div>
                        </td>
                        <td className="p-4 font-bold text-green-600">₹{d.amount}</td>
                        <td className="p-4 text-sm text-gray-600">
                        {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm font-mono text-gray-800 break-all max-w-xs">
                        {d.razorpayPaymentId?.replace(/^MOCK_(PAY|PAYMENT)_?/i, '') || "N/A"}
                        </td>
                        <td className="p-4 text-center">
                        {d.receiptPath ? (
                            <div className="relative group">
                            <Button
                                size="sm"
                                className="rounded-xl h-9 px-3 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white text-xs shadow-md font-medium whitespace-nowrap"
                            >
                                📄 Receipt
                            </Button>
                            
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                {/* VIEW - INLINE PDF viewer */}
                                <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-left justify-start h-10 text-sm hover:bg-green-50 border-b border-gray-100"
                                onClick={() => {
                                    window.open(`http://localhost:5000/api/donation/admin/receipt/${d._id}/view`, '_blank', 'width=1000,height=800');
                                }}
                                >
                                <span className="flex items-center gap-2">
                                    👁️ <span>View PDF</span>
                                </span>
                                </Button>
                                
                                {/* DOWNLOAD - Force download */}
                                <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-left justify-start h-10 text-sm hover:bg-emerald-50"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `http://localhost:5000/api/donation/admin/receipt/${d._id}`;
                                    link.download = `receipt-${d._id.slice(-8)}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                >
                                <span className="flex items-center gap-2">
                                    💾 <span>Download</span>
                                </span>
                                </Button>
                            </div>
                            </div>
                        ) : (
                            <Badge variant="secondary" className="text-xs px-4 py-2">
                            No Receipt
                            </Badge>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {/* TOTAL ROW */}
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-2xl mt-4 border">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                    <div className="text-2xl font-bold text-indigo-700">
                        Total Donors: <span className="text-3xl">{donations.length}</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                        Total Amount: <span className="text-3xl">₹{donations.reduce((sum, d) => sum + Number(d.amount || 0), 0)}</span>
                    </div>
                    </div>
                    <Button 
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8"
                    onClick={async () => {
                        // Dynamic import - fixes Vite ESM issue
                        const XLSX = await import('xlsx');
                        
                        // Prepare data for Excel
                        const excelData = donations.map(d => ({
                        "Donor Name": `${d.donorId?.firstname || ""} ${d.donorId?.lastname || ""}`.trim() || "Anonymous",
                        "Email": d.donorId?.email || "N/A",
                        "Phone": d.donorId?.phone || "N/A",
                        "Amount (₹)": d.amount,
                        "Payment ID": d.razorpayPaymentId?.replace(/^MOCK_(PAY|PAYMENT)_?/i, '') || "N/A",
                        "Order ID": d.razorpayOrderId?.replace(/^MOCK_(ORDER)_?/i, '') || "N/A",
                        "Date": new Date(d.createdAt).toLocaleDateString('en-IN'),
                        "Time": new Date(d.createdAt).toLocaleTimeString('en-IN'),
                        "Receipt": d.receiptPath ? "Yes" : "No",
                        "Status": d.status || "Completed"
                        }));

                        // Add summary row
                        const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
                        excelData.push({
                        "Donor Name": "TOTAL",
                        "Email": "",
                        "Phone": "",
                        "Amount (₹)": totalAmount,
                        "Payment ID": "",
                        "Order ID": "",
                        "Date": "",
                        "Time": "",
                        "Receipt": donations.length,
                        "Status": `${donations.length} Donations`
                        });

                        // Create workbook
                        const ws = XLSX.utils.json_to_sheet(excelData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Donations");

                        // Column widths
                        ws['!cols'] = [
                        { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
                        { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
                        { wch: 10 }, { wch: 15 }
                        ];

                        // Download
                        const filename = `${request.title.replace(/[^a-zA-Z0-9]/g, '_')}-donations-${new Date().toLocaleDateString('en-IN')}.xlsx`;
                        XLSX.writeFile(wb, filename);
                    }}
                    >
                    📊 Export Summary
                    </Button>
                </div>
                </div>
            </div>
            ) : (    
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">No donations yet for this campaign</p>
                <p className="text-gray-400 mt-2">Be the first to contribute!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}