import { useEffect, useState } from "react";
import axios from "axios";
import { LinkedInHeader } from "../../components/Linkedin-header";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function EventPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("");
  const [image, setImage] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 🔍 Image Preview State
  const [previewImage, setPreviewImage] = useState(null);

  const navigate = useNavigate();

  // ✅ Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        setCurrentUser(res.data);
        if (!res.data._id || !res.data.username) navigate("/auth");
      } catch (err) {
        navigate("/auth");
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  // ✅ Fetch events
  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/events", {
        withCredentials: true,
      });
      setEvents(res.data);
      setFilteredEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 🔍 Search
  const handleSearch = () => {
    const filtered = events.filter((event) => {
      const matchesSearch = event.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const eventDate = new Date(event.date);
      const matchesStart = startDate ? eventDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? eventDate <= new Date(endDate) : true;

      return matchesSearch && matchesStart && matchesEnd;
    });
    setFilteredEvents(filtered);
  };

  // ➕ Create Event
  const createEvent = async () => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("date", date);
      formData.append("seats", seats);
      if (image) formData.append("image", image);

      await axios.post("http://localhost:5000/api/events", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTitle("");
      setDescription("");
      setDate("");
      setSeats("");
      setImage(null);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || "Error creating event");
    } finally {
      setShowPopup(false);
    }
  };

  // 🙋 Participate
  const participate = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/api/events/${id}/participate`,
        {},
        { withCredentials: true }
      );
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || "Error participating");
    }
  };

  const cancelParticipation = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/api/events/${id}/cancel`,
        {},
        { withCredentials: true }
      );
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // ❌ Delete Event
  const deleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`, {
        withCredentials: true,
      });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || "Error deleting event");
    }
  };

  // 👥 View Participants
  const viewParticipants = async (eventId, title) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/events/${eventId}/participants`,
        { withCredentials: true }
      );
      setParticipants(res.data || []);
      setSelectedEventTitle(title);
      setShowParticipants(true);
    } catch (err) {
      alert(err.response?.data?.error || "Error fetching participants");
    }
  };

  // 📥 Download Excel
  const downloadParticipantsExcel = () => {
    if (!participants.length) return alert("No participants");

    const data = participants.map((p, i) => ({
      "S.No": i + 1,
      Name: p.username,
      Email: p.email,
      Role: p.role,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });

    saveAs(blob, `${selectedEventTitle}_participants.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50">
      <LinkedInHeader />

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* 🔍 Search */}
        <div className="bg-white rounded-3xl p-6 shadow-lg sticky top-24">
          <input
            placeholder="Search event"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 w-full rounded mb-3"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 w-full rounded mb-3"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 w-full rounded mb-3"
          />
          <button
            onClick={handleSearch}
            className="w-full bg-indigo-600 text-white py-2 rounded"
          >
            Search
          </button>
        </div>

        {/* 📅 Events */}
        <div className="md:col-span-3">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              className="bg-white rounded-3xl shadow-lg mb-8 overflow-hidden"
            >
              {event.image && (
  <div
    className="relative group cursor-pointer"
    onClick={() => setPreviewImage(event.image)}
  >
    <img
      src={event.image}
      alt="Event"
      className="w-full h-80 object-cover"
    />

    {/* Hover overlay */}
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
      <span className="text-white text-lg font-semibold">
        Tap to view
      </span>
    </div>
  </div>
)}


              <div className="p-6">
                <h2 className="text-xl font-bold">{event.title}</h2>
                <p className="text-gray-600">{event.description}</p>
                <p className="text-sm mt-2">
                  📅 {new Date(event.date).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  🎟 {event.participants.length}/{event.seats}
                </p>
              </div>

              <Separator />

              <div className="flex justify-between p-4">
                {(currentUser?.role === "student" ||
                  currentUser?.role === "alumni") &&
                  (event.participants.some(
                    (p) => p._id === currentUser._id
                  ) ? (
                    <button
                      onClick={() => cancelParticipation(event._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => participate(event._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Participate
                    </button>
                  ))}

                {(currentUser?._id === event.createdBy?._id ||
                  currentUser?.role === "admin") && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        viewParticipants(event._id, event.title)
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Participants
                    </button>
                    <button
                      onClick={() => deleteEvent(event._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🖼️ Full Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            className="max-w-[90%] max-h-[90%] rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-6 text-white text-3xl"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
