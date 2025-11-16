// src/pages/ReminderPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReminderPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/reminders/${date}`);
        setReminders(res.data);
      } catch (err) {
        console.error("Failed to fetch reminders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [date]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button
        variant="secondary"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        ← Back
      </Button>
      <h2 className="text-2xl font-bold mb-4">Reminders for {new Date(date).toDateString()}</h2>

      {loading ? (
        <p>Loading reminders...</p>
      ) : reminders.length === 0 ? (
        <p className="text-gray-500 italic">No reminders set for this date.</p>
      ) : (
        reminders.map((r) => (
          <Card key={r._id} className="mb-3">
            <CardContent>
              <p className="text-gray-800">{r.message}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
