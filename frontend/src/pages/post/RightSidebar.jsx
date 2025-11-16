import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, Quote } from "lucide-react";
import { CalendarDays } from "lucide-react"; // icon for calendar section
import Calendar from "react-calendar"; // actual calendar component
// import "react-calendar/dist/Calendar.css"; // calendar styles



// 🌟 50 Motivational / Daily Thoughts
const THOUGHTS = [
  "Believe you can and you’re halfway there.",
  "Small steps every day lead to big change.",
  "Stay positive, work hard, make it happen.",
  "Don’t watch the clock; do what it does — keep going.",
  "Success is the sum of small efforts repeated daily.",
  "Your limitation—it’s only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Sometimes later becomes never. Do it now.",
  "Little by little, one travels far.",
  "If you can dream it, you can do it.",
  "Hustle in silence, let success make the noise.",
  "You don’t have to be perfect to be amazing.",
  "Work hard in silence, let your success be your noise.",
  "Discipline is choosing between what you want now and what you want most.",
  "Don’t stop until you’re proud.",
  "Be stronger than your excuses.",
  "Your only limit is your mind.",
  "Doubt kills more dreams than failure ever will.",
  "Consistency is more important than perfection.",
  "One day or day one — you decide.",
  "It always seems impossible until it’s done.",
  "Strive for progress, not perfection.",
  "You get what you work for, not what you wish for.",
  "Make today so awesome that yesterday gets jealous.",
  "The harder you work for something, the greater you’ll feel when you achieve it.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Don’t limit your challenges. Challenge your limits.",
  "Act as if what you do makes a difference. It does.",
  "A little progress each day adds up to big results.",
  "Stay humble, work hard, be kind.",
  "Dream big. Work hard. Stay focused.",
  "Failure is the opportunity to begin again, smarter.",
  "Great things take time. Be patient.",
  "Work hard and be proud of what you achieve.",
  "Opportunities don’t happen, you create them.",
  "Success doesn’t come to you, you go to it.",
  "Start where you are. Use what you have. Do what you can.",
  "Be fearless in pursuit of what sets your soul on fire.",
  "Every day is a second chance.",
  "Don’t be busy, be productive.",
  "Keep your eyes on the stars, and your feet on the ground.",
  "The secret to getting ahead is getting started.",
  "Make yourself proud.",
  "Don’t be afraid to start over; it’s a new chance to rebuild.",
  "Success is not for the lazy.",
  "You’re doing better than you think.",
  "It’s never too late to be what you might have been.",
  "Your future is created by what you do today, not tomorrow."
];




export default function RightSidebar() {
  const [currentUser, setCurrentUser] = useState(null);
  const [emailRequests, setEmailRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [reminders, setReminders] = useState([]);
const [selectedDate, setSelectedDate] = useState(null);
const [reminderText, setReminderText] = useState("");
const [showReminderInput, setShowReminderInput] = useState(false);


  const isAdmin = currentUser?.role === "admin";
  const isUser = ["alumni", "student"].includes(currentUser?.role?.toLowerCase());


  // Fetch reminders for all users
useEffect(() => {
  axios
    .get("http://localhost:5000/api/reminders")
    .then((res) => setReminders(res.data))
    .catch(() => setReminders([]));
}, []);


  useEffect(() => {
    axios
      .get("http://localhost:5000/api/auth/me", { withCredentials: true })
      .then((res) => setCurrentUser(res.data))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          "http://localhost:5000/api/email-change-requests",
          { withCredentials: true }
        );
        const pending = res.data.filter((r) => r.status === "pending");
        const past = res.data.filter((r) => r.status !== "pending");
        setEmailRequests(pending);
        setHistory(past);
      } catch (err) {
        console.error("Error fetching email change requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [isAdmin]);

  const handleAction = useCallback(async (id, action) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/email-change-requests/${id}`,
        { action },
        { withCredentials: true }
      );

      const completedRequest = res.data.request;
      setEmailRequests((prev) => prev.filter((r) => r._id !== id));
      setHistory((prev) => [...prev, completedRequest]);
    } catch (err) {
      console.error(`${action} failed:`, err);
      alert(err.response?.data?.message || `Failed to ${action} request.`);
    }
  }, []);

  const today = new Date();
  const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24)) % 50;
  const todayThought = THOUGHTS[dayIndex];

  // 📅 Handle day click
const handleDateClick = (date) => {
  setSelectedDate(date);
  setShowReminderInput(true);
};

// Save reminder (Admin only)
const handleSaveReminder = async () => {
  if (!reminderText.trim()) return alert("Please enter a reminder!");

  try {
    const res = await axios.post("http://localhost:5000/api/reminders", {
      date: selectedDate,
      message: reminderText,
      userId: currentUser?._id, // attach logged-in user
    });

    setReminders((prev) => [...prev, res.data]);
    setShowReminderInput(false);
    setReminderText("");
    alert("Reminder set successfully!");
  } catch (err) {
    console.error("Failed to save reminder:", err);
    alert("Error saving reminder.");
  }
};





  return (

    
    <div className="sticky top-6 space-y-6">

      {/* 🌟 Admin Section */}
      {isAdmin && (
        <Card className="fixed top-20 right-20 w-80 rounded-2xl border border-gray-200 shadow-lg bg-gradient-to-br from-white via-blue-50 to-blue-100 hover:shadow-blue-300/40 transition-all z-50">

          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Email Change Requests
              </h2>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500 animate-pulse">
                Loading requests...
              </p>
            ) : emailRequests.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center">
                No pending requests 🎉
              </p>
            ) : (
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                {emailRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 transition-all hover:shadow-md"
                  >
                    <p className="font-semibold text-gray-800 text-sm">
                      {req.userId?.firstname ||
                        req.userId?.username ||
                        "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Current:</span>{" "}
                      {req.currentEmail}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Requested:</span>{" "}
                      {req.newEmail}
                    </p>
                    {req.reason && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        “{req.reason}”
                      </p>
                    )}

                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        size="sm"
                        disabled={actionLoading === req._id}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full px-3 py-1 shadow-sm transition-transform hover:scale-105"
                        onClick={() => {
                          setActionLoading(req._id);
                          handleAction(req._id, "approve").finally(() =>
                            setActionLoading(null)
                          );
                        }}
                      >
                        {actionLoading === req._id ? "..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actionLoading === req._id}
                        className="rounded-full px-3 py-1 shadow-sm transition-transform hover:scale-105"
                        onClick={() => {
                          setActionLoading(req._id);
                          handleAction(req._id, "deny").finally(() =>
                            setActionLoading(null)
                          );
                        }}
                      >
                        {actionLoading === req._id ? "..." : "Deny"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 py-1"
                onClick={() => setHistoryOpen(!historyOpen)}
              >
                {historyOpen ? "Close History" : "View History"}
              </Button>
            </div>

            {historyOpen && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-[45vh] overflow-y-auto transition-all">
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center">
                    No past requests.
                  </p>
                ) : (
                  history.map((req) => (
                    <div
                      key={req._id}
                      className="p-3 mb-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {req.userId?.firstname ||
                          req.userId?.username ||
                          "Unknown User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Current: {req.currentEmail}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested: {req.newEmail}
                      </p>
                      <p
                        className={`text-xs mt-1 font-medium ${
                          req.status === "approved"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Status: {req.status}
                      </p>
                      {req.reason && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          “{req.reason}”
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    {/* 🗓️ Calendar Section */}
{isUser && (
  <Card className="right-sidebar-calendar fixed top-[290px] right-10 w-[300px] md:w-[360px] h-[350px] rounded-3xl shadow-2xl border border-purple-300
                   bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50
                   overflow-hidden transition-all hover:shadow-purple-400/50 z-50 p-4">
    <div className="flex items-center gap-2 mb-3">
      <CalendarDays className="w-5 h-5 text-purple-700" />
      <h3 className="font-semibold text-gray-800 text-sm md:text-base">Reminders</h3>
    </div>

    <Calendar
      style={{ width: "100%", height: "calc(100% - 50px)", backgroundColor: "transparent" }}
      onClickDay={(date) => {
        const existingReminder = reminders.find(
          (r) => new Date(r.date).toDateString() === date.toDateString()
        );
        setSelectedDate(date);
        setReminderText(existingReminder ? existingReminder.message : "");
        setShowReminderInput(true);
      }}
      value={selectedDate}
      className="w-full text-sm md:text-base"
      tileClassName={({ date, view }) => {
        if (view !== "month") return "";

        const hasReminder = reminders.some(
          (r) => new Date(r.date).toDateString() === date.toDateString()
        );
        const isSelected =
          selectedDate && date.toDateString() === selectedDate.toDateString();
        const today = new Date().toDateString();
        const isToday = date.toDateString() === today;

        let classes =
          "flex items-center justify-center rounded-lg text-center transition-all duration-300 ease-in-out cursor-pointer";

        classes += " w-[36px] h-[36px] md:w-[40px] md:h-[40px] m-[1px]";

        if (hasReminder) {
          classes +=
            " bg-purple-600 text-white font-semibold shadow-md hover:scale-105 hover:shadow-lg";
        } else {
          classes +=
            " bg-white text-gray-800 hover:bg-purple-100 hover:text-purple-700 hover:scale-105";
        }

        if (isSelected)
          classes +=
            " ring-2 ring-purple-700 bg-purple-700 text-white font-bold shadow-lg";

        if (isToday && !isSelected)
          classes += " border-2 border-purple-400 font-semibold shadow-sm";

        return classes;
      }}
      formatDay={(locale, date) => date.getDate()}
    />

    {/* Custom CSS for navigation and weekdays */}
    <style jsx>{`
  /* Month navigation */
  .react-calendar__navigation {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0.5rem;
    background-color: transparent;
    margin-bottom: 0.25rem;
  }
  .react-calendar__navigation button {
    min-width: 30px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #5b21b6; /* purple-700 */
    background: transparent;
    border: none;
    border-radius: 6px;
    transition: all 0.2s ease-in-out;
  }
  .react-calendar__navigation button:hover {
    background-color: #d8b4fe; /* purple-200 */
    transform: scale(1.1);
  }

  /* Weekday labels */
  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-size: 0.7rem;
    font-weight: 600;
    color: #6b7280; /* gray-500 */
    margin-bottom: 0.2rem;
  }

  /* Days grid spacing */
  .react-calendar__month-view__days {
    display: grid !important;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  /* Neighboring month dates (previous/next month) */
  .react-calendar__month-view__days__day--neighboringMonth {
    color: #9ca3af; /* gray-400 */
    opacity: 0.5; /* blur/faded effect */
  }
`}</style>

  </Card>
)}




{/* Reminder Modal */}
{showReminderInput && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

    <div className="relative bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md z-10">
      <p className="text-sm text-gray-700 mb-2">
        {reminders.some(r => new Date(r.date).toDateString() === selectedDate?.toDateString())
          ? `Reminder for ${selectedDate?.toDateString()}`
          : `Set reminder for ${selectedDate?.toDateString()}`}
      </p>
      <textarea
        className="w-full p-2 border rounded-md text-sm"
        rows="3"
        placeholder="Enter reminder message..."
        value={reminderText}
        onChange={(e) => setReminderText(e.target.value)}
      />
      <div className="flex justify-end mt-4 gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowReminderInput(false)}
        >
          Close
        </Button>
        <Button size="sm" onClick={handleSaveReminder}>
          Save
        </Button>
      </div>
    </div>
  </div>
)}




      {/* 💭 Daily Thought Section */}
      {isUser && (
        <Card className="fixed top-16 right-10 w-[320px] md:w-[360px]  md:h-[180px] rounded-3xl shadow-2xl border border-purple-200 
               bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 
               overflow-hidden transition-all hover:shadow-purple-300/50 z-50">
          {/* ✨ 3 Small Floating Sparkles */}
     {/* ✨ Floating Corner Stars (Component-Scoped Animation) */}
<style jsx>{`
  @keyframes floatStar {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
      opacity: 0.9;
    }
    50% {
      transform: translateY(-10px) rotate(10deg);
      opacity: 1;
    }
  }
  .floatStar {
    animation: floatStar 4s ease-in-out infinite;
  }
`}</style>

<div className="absolute inset-0 pointer-events-none overflow-hidden">
  {/* Top-right star */}
  <Sparkles
    className="absolute w-5 h-5 text-yellow-400 opacity-80 floatStar"
    style={{ top: "10%", right: "8%" }}
  />
  {/* Bottom-left star */}
  <Sparkles
    className="absolute w-6 h-6 text-yellow-400 opacity-75 floatStar"
    style={{ bottom: "12%", left: "10%" }}
  />
  {/* Optional middle sparkle */}
  <Sparkles
    className="absolute w-4 h-4 text-yellow-300 opacity-70 floatStar"
    style={{ bottom: "35%", right: "40%" }}
  />
</div>



          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Quote className="w-6 h-6 text-purple-700 drop-shadow-md" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent tracking-wide">
                  Daily Inspiration
                </h2>
              </div>
            </div>

            <p className="text-base md:text-lg font-medium italic text-gray-800 leading-relaxed text-center">
              “{todayThought}”
            </p>

            {reminders.find(r => new Date(r.date).toDateString() === today.toDateString()) && (
  <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300 text-sm text-gray-800 text-center">
    🔔 <strong>Reminder:</strong> {reminders.find(r => new Date(r.date).toDateString() === today.toDateString()).message}
  </div>
)}


            <div className="mt-4 h-[2px] bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 rounded-full animate-pulse" />
            <p className="text-xs text-gray-500 text-right mt-3 italic">
              {/* Thought #{dayIndex + 1}/50 ✨ */}
            </p>
          </CardContent>
        </Card>
      )}

      
    </div>
  );
}



