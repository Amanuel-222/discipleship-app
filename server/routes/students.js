const router = require("express").Router();
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Assignment = require("../models/Assignment");
const Note = require("../models/Note");

router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, notes } = req.body;
    const student = await Student.create({ name, email, notes });
    await Attendance.updateMany({}, { $push: { records: { student: student._id, present: false } } });
    await Assignment.updateMany({}, { $push: { submissions: { student: student._id, submitted: false } } });
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, email, notes } = req.body;
    const student = await Student.findByIdAndUpdate(req.params.id, { name, email, notes }, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    await Attendance.updateMany({}, { $pull: { records: { student: req.params.id } } });
    await Assignment.updateMany({}, { $pull: { submissions: { student: req.params.id } } });
    await Note.deleteMany({ student: req.params.id });
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard/stats", async (req, res) => {
  try {
    const students = await Student.find();
    const sessions = await Attendance.find();
    const assignments = await Assignment.find();

    const stats = students.map((s) => {
      const sid = s._id.toString();
      let presentCount = 0;
      sessions.forEach((session) => {
        const rec = session.records.find((r) => r.student.toString() === sid);
        if (rec && rec.present) presentCount++;
      });
      const attendancePct = sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : null;

      let submittedCount = 0;
      assignments.forEach((a) => {
        const sub = a.submissions.find((r) => r.student.toString() === sid);
        if (sub && sub.submitted) submittedCount++;
      });
      const assignmentPct = assignments.length > 0 ? Math.round((submittedCount / assignments.length) * 100) : null;

      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        attendancePct,
        attendanceLabel: `${presentCount}/${sessions.length}`,
        assignmentPct,
        assignmentLabel: `${submittedCount}/${assignments.length}`,
      };
    });

    res.json({
      totalStudents: students.length,
      totalSessions: sessions.length,
      totalAssignments: assignments.length,
      students: stats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
