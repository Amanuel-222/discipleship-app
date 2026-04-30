const mongoose = require("mongoose");

// Each Session is one class meeting (by date)
const attendanceSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // e.g. "2024-01-14"
    label: { type: String, default: "" },   // optional label like "Week 1"
    // Array of records: one per student
    records: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        present: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
