const router = require("express").Router();
const Note = require("../models/Note");

// GET all notes for a student
router.get("/student/:studentId", async (req, res) => {
  try {
    const notes = await Note.find({ student: req.params.studentId }).sort({
      createdAt: -1,
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a note for a student
router.post("/", async (req, res) => {
  try {
    const { studentId, text } = req.body;
    const note = await Note.create({ student: studentId, text });
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a note
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
