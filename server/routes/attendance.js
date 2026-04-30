const router = require("express").Router();
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// GET all sessions (with student records populated)
router.get("/", async (req, res) => {
  try {
    const sessions = await Attendance.find()
      .populate("records.student", "name email")
      .sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single session
router.get("/:id", async (req, res) => {
  try {
    const session = await Attendance.findById(req.params.id).populate(
      "records.student",
      "name email"
    );
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new session — auto-populate all current students as absent
router.post("/", async (req, res) => {
  try {
    const { date, label } = req.body;
    const students = await Student.find();
    const records = students.map((s) => ({ student: s._id, present: false }));
    const session = await Attendance.create({ date, label, records });
    const populated = await session.populate("records.student", "name email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update a single student's attendance in a session
router.patch("/:sessionId/record/:studentId", async (req, res) => {
  try {
    const { present } = req.body;
    const session = await Attendance.findOneAndUpdate(
      {
        _id: req.params.sessionId,
        "records.student": req.params.studentId,
      },
      { $set: { "records.$.present": present } },
      { new: true }
    ).populate("records.student", "name email");

    if (!session) return res.status(404).json({ error: "Session or student not found" });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a session
router.delete("/:id", async (req, res) => {
  try {
    const session = await Attendance.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
