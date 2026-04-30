const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    notes: { type: String, default: "" }, // General notes about the student
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
