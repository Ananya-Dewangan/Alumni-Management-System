import express from "express";
import Reminder from "../models/Reminder.js";

const router = express.Router();

/* ---------------------------------------------
   GET all reminders
---------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const reminders = await Reminder.find().sort({ date: 1 });
    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reminders" });
  }
});

/* ---------------------------------------------
   POST new reminder
---------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const { date, message, userId } = req.body;

    if (!date || !message) {
      return res.status(400).json({ message: "Date and message are required" });
    }

    const newReminder = new Reminder({
      date,
      message,
      createdBy: userId,
    });

    const savedReminder = await newReminder.save();
    res.status(201).json(savedReminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save reminder" });
  }
});

/* ---------------------------------------------
   GET reminders by specific date
   (Moved to /date/:date to avoid conflict with /:id)
---------------------------------------------- */
router.get("/date/:date", async (req, res) => {
  try {
    const { date } = req.params;

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const reminders = await Reminder.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reminders for the date" });
  }
});

/* ---------------------------------------------
   UPDATE reminder (PUT)
---------------------------------------------- */
router.put("/:id", async (req, res) => {
  try {
    const { message, date } = req.body;

    const updatedReminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      { message, date },
      { new: true }
    );

    if (!updatedReminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json(updatedReminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update reminder" });
  }
});

/* ---------------------------------------------
   DELETE reminder
---------------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const deletedReminder = await Reminder.findByIdAndDelete(req.params.id);

    if (!deletedReminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json({ message: "Reminder deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete reminder" });
  }
});

export default router;
