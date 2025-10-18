// EventPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { LinkedInHeader } from "../../components/linkedin-header";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

export default function EventPage() {
    const [events, setEvents] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [seats, setSeats] = useState("");
    const [image, setImage] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // New states for search & date range
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
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/events", { withCredentials: true });
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

            setTitle(""); setDescription(""); setDate(""); setSeats(""); setImage(null);
            fetchEvents();
        } catch (err) {
            alert(err.response?.data?.error || "Error");
        } finally {
            setShowPopup(false);
        }
    };

    const participate = async (id) => {
        try {
            await axios.post(`http://localhost:5000/api/events/${id}/participate`, {}, { withCredentials: true });
            fetchEvents();
        } catch (err) {
            alert(err.response?.data?.error || "Error");
        }
    };

    const cancelParticipation = async (id) => {
        await axios.post(`http://localhost:5000/api/events/${id}/cancel`, {}, { withCredentials: true });
        fetchEvents();
    };

    // Filtered Events
    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());

        const eventDate = new Date(event.date);
        const matchesStart = startDate ? eventDate >= new Date(startDate) : true;
        const matchesEnd = endDate ? eventDate <= new Date(endDate) : true;

        return matchesSearch && matchesStart && matchesEnd;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <LinkedInHeader />

            <div className="max-w-xl mx-auto p-4">

                {/* Search & Filter */}
                {/* Search & Filter Section */}
                <div className="sticky top-16 z-10 bg-gray-50 pb-4">
                    <h1 className="flex text-2xl font-bold mb-4">Events</h1>
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                        {/* Search by Name */}
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border p-2 rounded w-full sm:w-1/2"
                        />

                        {/* Date Range Filter */}
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


                {/* Events list */}
                {filteredEvents.length === 0 ? (
                    <p className="text-gray-500">No events found.</p>
                ) : (
                    filteredEvents.map(event => (
                        <div
                            key={event._id}
                            className="border rounded mb-6 bg-white shadow max-w-xl mx-auto"
                        >
                            {/* Event Image */}
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

                            {/* Engagement & Actions */}
                            <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Participants:</span>
                                    <span>{event.participants.length}</span>
                                </div>

                                {currentUser?.role === "student" && (
                                    event.participants.some(p => p._id === currentUser._id) ? (
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
                                    )
                                )}
                            </div>
                        </div>
                    ))
                )}

                {currentUser?.role === "alumni" && (
                    <button
                        onClick={() => setShowPopup(true)}
                        className="fixed bottom-6 right-6 bg-blue-500 text-white text-2xl px-4 py-2 rounded-full shadow-lg hover:bg-blue-600"
                    >
                        +
                    </button>
                )}

                {/* Popup for Creating Event */}
                {showPopup && currentUser?.role === "alumni" && (
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
