import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Download } from "lucide-react";
import LinkedInHeader from "../components/Linkedin-header";
import { useNavigate } from "react-router-dom";

export default function AdminDataExport() {
  const navigate = useNavigate();

  // Load filters and data from sessionStorage if available
  const storedFilters = JSON.parse(sessionStorage.getItem("filters") || "{}");
  const storedData = JSON.parse(sessionStorage.getItem("data") || "[]");

  const [role, setRole] = useState(storedFilters.role || "");
  const [course, setCourse] = useState(storedFilters.course || "");
  const [department, setDepartment] = useState(storedFilters.department || "");
  const [graduation_year, setGraduationYear] = useState(storedFilters.graduation_year || "");
  const [data, setData] = useState(storedData || []);
  const [loading, setLoading] = useState(false);

  const baseURL = "http://localhost:5000/api/admin";

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
    "MBA": ["Marketing", "Finance", "Human Resource", "Systems", "Production and Operations Management"],
    "PhD": ["Management and Engineering"],
  };

  // Fetch all only if no data in sessionStorage
  useEffect(() => {
    if (storedData.length === 0) {
      handleFetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/export-data`, {
        params: { role, course, department, graduation_year },
        withCredentials: true,
      });
      setData(res.data);

      // ✅ Save current filtered data to sessionStorage
      sessionStorage.setItem("data", JSON.stringify(res.data));
      sessionStorage.setItem("filters", JSON.stringify({ role, course, department, graduation_year }));
    } catch {
      alert("No data found for selected filters.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/export-data`, { withCredentials: true });
      setData(res.data);

      // Save all data in sessionStorage
      sessionStorage.setItem("data", JSON.stringify(res.data));
      sessionStorage.setItem("filters", JSON.stringify({}));
    } catch {
      alert("Failed to fetch all data.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await axios.get(`${baseURL}/export-excel`, {
        params: { role, course, department, graduation_year },
        responseType: "blob",
        withCredentials: true,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "alumni_data.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch {
      alert("Failed to download Excel file.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInHeader />
      <div className="p-8 max-w-7xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">📊 Data Export</h2>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2 rounded-md">
                <option value="">Select Role</option>
                <option value="alumni">Alumni</option>
                <option value="student">Student</option>
              </select>

              <select
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value);
                  setDepartment("");
                }}
                className="border p-2 rounded-md"
              >
                <option value="">Select Course</option>
                {courseOptions.map((c) => <option key={c}>{c}</option>)}
              </select>

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="border p-2 rounded-md"
                disabled={!course}
              >
                <option value="">Select Department</option>
                {(departmentOptions[course] || []).map((d) => <option key={d}>{d}</option>)}
              </select>

              <Input
                placeholder="Batch / Graduation Year"
                value={graduation_year}
                onChange={(e) => setGraduationYear(e.target.value)}
              />

              <div className="flex gap-2">
                <Button onClick={handleFilter} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                  Search
                </Button>
                <Button onClick={handleFetchAll} className="bg-green-600 hover:bg-green-700">
                  Fetch All
                </Button>
              </div>
            </div>

            <div className="text-right mb-4">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download Excel
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin w-8 h-8 mx-auto" />
              </div>
            ) : data.length > 0 ? (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full bg-white">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="border px-4 py-2">S. No</th>
                      <th className="border px-4 py-2">Name</th>
                      <th className="border px-4 py-2">Email</th>
                      <th className="border px-4 py-2">Role</th>
                      <th className="border px-4 py-2">Course</th>
                      <th className="border px-4 py-2">Department</th>
                      <th className="border px-4 py-2">Batch</th>
                      <th className="border px-4 py-2 text-center">Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2 text-center">{index + 1}</td>
                        <td className="border px-4 py-2">{item.name}</td>
                        <td className="border px-4 py-2">{item.email}</td>
                        <td className="border px-4 py-2 capitalize">{item.role}</td>
                        <td className="border px-4 py-2">{item.course}</td>
                        <td className="border px-4 py-2">{item.department}</td>
                        <td className="border px-4 py-2">{item.graduation_year}</td>
                        <td className="border px-4 py-2 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-500 hover:bg-blue-50"
                            onClick={() => navigate(`/profile/${item._id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-6 text-gray-500">No data found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
