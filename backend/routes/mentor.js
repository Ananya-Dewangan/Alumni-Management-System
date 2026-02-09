// routes/mentor.js
import express from "express";
import User from "../models/User.js"; // <-- add .js extension for ES module

const router = express.Router();

// Utility to calculate skill similarity using cosine similarity
const cosineSimilarity = (vecA, vecB) => {
  const dot = vecA.reduce((acc, val, i) => acc + val * (vecB[i] || 0), 0);
  const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dot / (magA * magB || 1);
};

// Simple skill-to-vector encoding (one-hot based on all skills)
const encodeSkills = (allSkills, userSkills) =>
  allSkills.map((skill) => (userSkills.includes(skill) ? 1 : 0));

router.get("/top-mentors/:studentId", async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const mentors = await User.find({ role: "alumni", skills: { $exists: true } });

    // Build skill vocabulary
    const skillSet = new Set();
    [student, ...mentors].forEach((u) =>
      u.skills.forEach((s) => skillSet.add(s.toLowerCase()))
    );
    const allSkills = Array.from(skillSet);

    // Encode student skills
    const studentVec = encodeSkills(
      allSkills,
      student.skills.map((s) => s.toLowerCase())
    );

    // Score mentors
    const scoredMentors = mentors
      .map((mentor) => {
        const mentorVec = encodeSkills(
          allSkills,
          mentor.skills.map((s) => s.toLowerCase())
        );
        const score = cosineSimilarity(studentVec, mentorVec);
        return { mentor, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // top 5
      .map((m) => m.mentor);

    res.json(scoredMentors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Export default for ES module
export default router;
