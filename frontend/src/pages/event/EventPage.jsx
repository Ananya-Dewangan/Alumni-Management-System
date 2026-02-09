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

  // 🔹 Added ONLY for image preview
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
        console.error("Error fetching current user:", err);
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
      console.error("Error fetching events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ✅ Search Functionality
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

  // ✅ Create event
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

  // ✅ Participate / Cancel
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
      console.error("Error canceling participation:", err);
    }
  };

  // ✅ Delete Event
  const deleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`, {
        withCredentials: true,
      });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || "Error deleting event");
    }
  };

  // ✅ View Participants
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

  // ✅ Download participants as Excel
  const downloadParticipantsExcel = () => {
    if (!participants.length)
      return alert("No participants to download.");

    const data = participants.map((p, idx) => ({
      "S.No": idx + 1,
      Name: p.username || "",
      Email: p.email || "",
      Role: p.role || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    const safeTitle = (selectedEventTitle || "event").replace(
      /[/\\?%*:|"<>]/g,
      "_"
    );
    saveAs(blob, `${safeTitle}_participants.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-blue-50 to-purple-50">
      <LinkedInHeader />

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 sticky top-24 h-fit bg-white/80 backdrop-blur-lg border border-indigo-100 rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-indigo-800 mb-5 text-center">
            🎯 Event Search
          </h2>

          <input
            type="text"
            placeholder="Search by event title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-indigo-200 p-2 rounded-lg w-full mb-3 focus:ring-2 focus:ring-indigo-300 outline-none"
          />

          <label className="text-sm text-gray-600">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-indigo-200 p-2 rounded-lg w-full mb-3"
          />

          <label className="text-sm text-gray-600">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-indigo-200 p-2 rounded-lg w-full mb-5"
          />

          <button
            onClick={handleSearch}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-2 rounded-full font-semibold hover:scale-105 transition-transform"
          >
            🔍 Search Events
          </button>
        </div>

        <div className="md:col-span-3">
          {filteredEvents.length === 0 ? (
            <p className="text-center text-gray-500 mt-16 text-lg">
              No events found.
            </p>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-3xl overflow-hidden shadow-xl mb-10"
              >
                {event.image && (
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => setPreviewImage(event.image)}
                  >
                    <img
                      src={event.image}
                      alt="Event Banner"
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        👆 Tap to View
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h2 className="text-2xl font-bold text-indigo-800 mb-2">
                    {event.title}
                  </h2>
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {event.description}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    📅 {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    🎟 Seats: {event.participants.length}/{event.seats}
                  </p>
                  <p className="text-sm text-gray-600">
                    👤 Created by: {event.createdBy?.username}
                  </p>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between items-center px-6 pb-5 text-sm">
                  <span className="text-gray-700">
                    👥 Participants: {event.participants.length}
                  </span>

                  {(currentUser?.role === "student" ||
                    currentUser?.role === "alumni") &&
                    (event.participants.some(
                      (p) => p._id === currentUser._id
                    ) ? (
                      <button
                        onClick={() => cancelParticipation(event._id)}
                        className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white hover:scale-105"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => participate(event._id)}
                        className="px-5 py-2 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white hover:scale-105"
                      >
                        Participate
                      </button>
                    ))}
                </div>

                {(currentUser?._id === event.createdBy?._id ||
                  currentUser?.role === "admin") && (
                  <div className="flex justify-center gap-3 pb-6">
                    <button
                      onClick={() =>
                        viewParticipants(event._id, event.title)
                      }
                      className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    >
                      View Participants
                    </button>
                    <button
                      onClick={() => deleteEvent(event._id)}
                      className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-red-600 text-white"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {(currentUser?.role === "alumni" || currentUser?.role === "admin") && (
        <button
          onClick={() => setShowPopup(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-3xl px-5 py-3 rounded-full shadow-2xl hover:scale-110"
        >
          +
        </button>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full p-4">
            <img
              src={previewImage}
              alt="Event Poster Preview"
              className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white text-black rounded-full px-3 py-1 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 🆕 Create Event Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
              Create New Event
            </h2>

            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mb-3"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mb-3"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mb-3"
            />
            <input
              type="number"
              placeholder="Total Seats"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mb-3"
            />
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full border border-gray-300 p-2 rounded mb-4"
            />

            <div className="flex justify-center gap-4">
              <button
                onClick={createEvent}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white"
              >
                Create
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}