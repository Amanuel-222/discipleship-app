const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate: { type: String, default: "" }, // e.g. "2024-01-21"
    // Submission status per student
    submissions: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        submitted: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
