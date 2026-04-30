const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    text: { type: String, required: true },
    // createdAt from timestamps is the date of the note
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
