import express from "express";
import ExcelJS from "exceljs";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; // Using your existing middleware

const router = express.Router();

/* -----------------------------------------------------------
   📊 Fetch filtered data (Admin only)
----------------------------------------------------------- */
router.get("/export-data", authMiddleware, async (req, res) => {
  try {
    const { role, department, graduation_year } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (department) filter.department = new RegExp(department, "i");
    if (graduation_year) filter.graduation_year = graduation_year;

    const users = await User.find(filter).select(
      "firstname lastname email role department graduation_year"
    );

    // Combine first and last name + add serial number
    const formattedUsers = users.map((u, index) => ({
      s_no: index + 1,
      _id: u._id,
      name: `${u.firstname || ""} ${u.lastname || ""}`.trim(),
      email: u.email,
      role: u.role,
      department: u.department || "-",
      graduation_year: u.graduation_year || "-",
    }));

    res.status(200).json(formattedUsers);
  } catch (err) {
    console.error("Error fetching filtered data:", err);
    res.status(500).json({ message: "Error fetching data" });
  }
});

/* -----------------------------------------------------------
   📥 Download Excel (Admin only)
----------------------------------------------------------- */
router.get("/export-excel", authMiddleware, async (req, res) => {
  try {
    const { role, department, graduation_year } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (department) filter.department = new RegExp(department, "i");
    if (graduation_year) filter.graduation_year = graduation_year;

    const users = await User.find(filter).select(
      "firstname lastname email role department graduation_year"
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Users Data");

    // Define columns (including S. No)
    sheet.columns = [
      { header: "S. No", key: "s_no", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 15 },
      { header: "Department", key: "department", width: 20 },
      { header: "Graduation Year", key: "graduation_year", width: 20 },
    ];

    // Add rows with S. No
    users.forEach((u, index) => {
      sheet.addRow({
        s_no: index + 1,
        name: `${u.firstname || ""} ${u.lastname || ""}`.trim(),
        email: u.email,
        role: u.role,
        department: u.department || "-",
        graduation_year: u.graduation_year || "-",
      });
    });

    // Add some basic styling (optional)
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: "center" };

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=exported_data.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error exporting Excel:", err);
    res.status(500).json({ message: "Error exporting data" });
  }
});

export default router;
