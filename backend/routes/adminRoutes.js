import express from "express";
import ExcelJS from "exceljs";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Utility to safely escape RegExp special chars */
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* -----------------------------------------------------------
   📊 Fetch filtered data (Admin only)
----------------------------------------------------------- */
router.get("/export-data", authMiddleware, async (req, res) => {
  try {
    const { role, course, department, graduation_year } = req.query;
    const filter = {};

    if (role) filter.role = new RegExp(`^${escapeRegex(role)}$`, "i");
    if (course) filter.course = new RegExp(escapeRegex(course), "i");
    if (department) filter.department = new RegExp(escapeRegex(department), "i");
    if (graduation_year) filter.graduation_year = graduation_year;

    console.log("🧾 Filters received:", req.query);
    console.log("🧮 Mongo filter used:", filter);

    const users = await User.find(filter).select(
      "firstname lastname email role course department graduation_year"
    );

    const formattedUsers = users.map((u, index) => ({
      s_no: index + 1,
      _id: u._id,
      name: `${u.firstname || ""} ${u.lastname || ""}`.trim(),
      email: u.email,
      role: u.role,
      course: u.course || "-",
      department: u.department || "-",
      graduation_year: u.graduation_year || "-",
    }));

    res.status(200).json(formattedUsers);
  } catch (err) {
    console.error("❌ Error fetching filtered data:", err);
    res.status(500).json({ message: "Error fetching data" });
  }
});

/* -----------------------------------------------------------
   📥 Download Excel (Admin only)
----------------------------------------------------------- */
router.get("/export-excel", authMiddleware, async (req, res) => {
  try {
    const { role, course, department, graduation_year } = req.query;
    const filter = {};

    if (role) filter.role = new RegExp(`^${escapeRegex(role)}$`, "i");
    if (course) filter.course = new RegExp(escapeRegex(course), "i");
    if (department) filter.department = new RegExp(escapeRegex(department), "i");
    if (graduation_year) filter.graduation_year = graduation_year;

    const users = await User.find(filter).select(
      "firstname lastname email role course department graduation_year"
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Users Data");

    sheet.columns = [
      { header: "S. No", key: "s_no", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 15 },
      { header: "Course", key: "course", width: 20 },
      { header: "Department", key: "department", width: 25 },
      { header: "Graduation Year", key: "graduation_year", width: 20 },
    ];

    users.forEach((u, index) => {
      sheet.addRow({
        s_no: index + 1,
        name: `${u.firstname || ""} ${u.lastname || ""}`.trim(),
        email: u.email,
        role: u.role,
        course: u.course || "-",
        department: u.department || "-",
        graduation_year: u.graduation_year || "-",
      });
    });

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: "center" };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=exported_data.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Error exporting Excel:", err);
    res.status(500).json({ message: "Error exporting data" });
  }
});

export default router;
