// src/pages/event/EventPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { LinkedInHeader } from "../../components/linkedin-header";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

// Excel export libs
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function EventPage() {
  const [events, setEvents] = useState([]);
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

  const navigate = useNavigate();

  // Load current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        setCurrentUser(res.data);

        if (!res.data._id || !res.data.username) {
          navigate("/auth");
          return;
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
        navigate("/auth");
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/events", {
        withCredentials: true,
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
      alert(err.response?.data?.error || "Error");
    } finally {
      setShowPopup(false);
    }
  };

  const participate = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/api/events/${id}/participate`,
        {},
        { withCredentials: true }
      );
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || "Error");
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

  // ✅ Fetch participants for an event
  const viewParticipants = async (eventId, title) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/events/${eventId}/participants`,
        { withCredentials: true }
      );
      // Expecting array of { _id, username, email, role }
      setParticipants(res.data || []);
      setSelectedEventTitle(title);
      setShowParticipants(true);
    } catch (err) {
      alert(err.response?.data?.error || "Error fetching participants");
    }
  };

  // ✅ Download participants as Excel
  const downloadParticipantsExcel = () => {
    if (!participants || participants.length === 0) {
      alert("No participants to download.");
      return;
    }

    const data = participants.map((p, idx) => ({
      "S.No": idx + 1,
      Name: p.username || "",
      Email: p.email || "",
      Role: p.role || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    const safeTitle = (selectedEventTitle || "event").replace(/[/\\?%*:|"<>]/g, "_");
    saveAs(blob, `${safeTitle}_participants.xlsx`);
  };

  // Filtered Events
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const eventDate = new Date(event.date);
    const matchesStart = startDate ? eventDate >= new Date(startDate) : true;
    const matchesEnd = endDate ? eventDate <= new Date(endDate) : true;
    return matchesSearch && matchesStart && matchesEnd;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInHeader />

      <div className="max-w-xl mx-auto p-4">
        {/* Search & Filter */}
        <div className="sticky top-16 z-10 bg-gray-50 pb-4">
          <h1 className="flex text-2xl font-bold mb-4">Events</h1>
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded w-full sm:w-1/2"
            />

            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border p-2 rounded w-1/2 sm:w-auto"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border p-2 rounded w-1/2 sm:w-auto"
              />
            </div>
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <p className="text-gray-500">No events found.</p>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event._id}
              className="border rounded mb-6 bg-white shadow max-w-xl mx-auto"
            >
              {event.image && (
                <img
                  src={event.image}
                  alt="Event"
                  className="w-full object-cover rounded-t"
                />
              )}

              <div className="p-4">
                <h2 className="text-lg font-bold">{event.title}</h2>
                <p className="text-gray-700 text-sm">{event.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  📅 {new Date(event.date).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  🎟 Seats: {event.participants.length}/{event.seats}
                </p>
                <p className="text-xs text-gray-500">
                  👤 Created by: {event.createdBy?.username}
                </p>
              </div>

              <Separator className="my-2" />

              {/* Participation Section */}
              <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Participants:</span>
                  <span>{event.participants.length}</span>
                </div>

                {currentUser?.role === "student" &&
                  (event.participants.some((p) => p._id === currentUser._id) ? (
                    <button
                      onClick={() => cancelParticipation(event._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => participate(event._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
                    >
                      Participate
                    </button>
                  ))}
              </div>

              {/* ✅ Admin/Creator Buttons */}
              {(currentUser?._id === event.createdBy?._id ||
                currentUser?.role === "admin") && (
                <div className="flex justify-center pb-4 gap-2">
                  <button
                    onClick={() => viewParticipants(event._id, event.title)}
                    className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 text-sm"
                  >
                    View Participants
                  </button>

                  <button
                    onClick={() => deleteEvent(event._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                  >
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {(currentUser?.role === "alumni" || currentUser?.role === "admin") && (
          <button
            onClick={() => setShowPopup(true)}
            className="fixed bottom-6 right-6 bg-blue-500 text-white text-2xl px-4 py-2 rounded-full shadow-lg hover:bg-blue-600"
          >
            +
          </button>
        )}

        {/* ✅ Participants Popup  */}
        {showParticipants && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h2 className="text-lg font-bold mb-4 text-center">
                Participants – {selectedEventTitle}
              </h2>

              {participants.length === 0 ? (
                <p className="text-gray-500 text-center">No participants yet.</p>
              ) : (
                <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200">
                  {participants.map((p) => (
                    <li key={p._id} className="py-3 text-sm text-gray-800">
                      <p className="font-semibold text-blue-700">{p.username}</p>
                      <p className="text-gray-600 text-xs">Email: {p.email}</p>
                      <p className="text-gray-500 text-xs italic">Role: {p.role}</p>
                    </li>
                  ))}
                </ul>
              )}

              {/* ✅ Download & Close buttons */}
              <div className="mt-4 text-center flex justify-center gap-3">
                {participants.length > 0 && (
                  <button
                    onClick={downloadParticipantsExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Download Excel
                  </button>
                )}
                <button
                  onClick={() => setShowParticipants(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Event Popup */}
        {showPopup && (currentUser?.role === "alumni" || currentUser?.role === "admin") && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-4 rounded-lg shadow-lg w-96">
              <h2 className="text-lg font-bold mb-2">Create Event</h2>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border w-full p-2 mb-2"
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border w-full p-2 mb-2"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border w-full p-2 mb-2"
              />
              <input
                type="number"
                placeholder="Seats"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="border w-full p-2 mb-2"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="mb-2"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPopup(false)}
                  className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={createEvent}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
