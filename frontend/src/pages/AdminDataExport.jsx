import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Download } from "lucide-react";

export default function AdminDataExport() {
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [graduation_year, setGraduationYear] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const baseURL = "http://localhost:5000/api/admin";

  // 🔍 Fetch filtered data
  const handleFilter = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/export-data`, {
        params: { role, department, graduation_year },
        withCredentials: true,
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching filtered data:", err);
      alert("No data found for selected filters.");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Fetch all data (Search All)
  const handleFetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/export-data`, {
        withCredentials: true,
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching all data:", err);
      alert("Failed to fetch all data.");
    } finally {
      setLoading(false);
    }
  };

  // ⬇️ Download Excel
  const handleDownload = async () => {
    try {
      const res = await axios.get(`${baseURL}/export-excel`, {
        params: { role, department, graduation_year },
        responseType: "blob",
        withCredentials: true,
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "alumni_data.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("Error downloading Excel:", err);
      alert("Failed to download Excel file.");
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <Card className="max-w-6xl mx-auto shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
            📊 Data Export
          </h2>

          {/* Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-gray-300 p-2 rounded-md focus:ring focus:ring-blue-200"
            >
              <option value="">Select Role</option>
              <option value="alumni">Alumni</option>
              <option value="student">Student</option>
            </select>

            <Input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <Input
              type="text"
              placeholder="Graduation Year"
              value={graduation_year}
              onChange={(e) => setGraduationYear(e.target.value)}
            />

            <div className="flex flex-col md:flex-row gap-2">
              <Button
                onClick={handleFilter}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                Search
              </Button>

              <Button
                onClick={handleFetchAll}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                Fetch All
              </Button>
            </div>
          </div>

          {/* Download Button */}
          <div className="text-right mb-4">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </Button>
          </div>

          {/* Table Section */}
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <Loader2 className="animate-spin w-8 h-8 mx-auto mb-2" />
              Loading data...
            </div>
          ) : data.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-blue-100 text-blue-700">
                  <tr>
                    <th className="px-4 py-2 border text-center">S. No</th>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Email</th>
                    <th className="px-4 py-2 border">Role</th>
                    <th className="px-4 py-2 border">Department</th>
                    <th className="px-4 py-2 border">Graduation Year</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border text-center">{index + 1}</td>
                      <td className="px-4 py-2 border">
                        {item.name || `${item.firstname || ""} ${item.lastname || ""}`}
                      </td>
                      <td className="px-4 py-2 border">{item.email}</td>
                      <td className="px-4 py-2 border capitalize">{item.role}</td>
                      <td className="px-4 py-2 border">{item.department}</td>
                      <td className="px-4 py-2 border">{item.graduation_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">No data found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
