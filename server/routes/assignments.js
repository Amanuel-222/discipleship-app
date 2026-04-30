const router = require("express").Router();
const Assignment = require("../models/Assignment");
const Student = require("../models/Student");

// GET all assignments
router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("submissions.student", "name email")
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single assignment
router.get("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate(
      "submissions.student",
      "name email"
    );
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create assignment — auto-populate all current students as not submitted
router.post("/", async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const students = await Student.find();
    const submissions = students.map((s) => ({ student: s._id, submitted: false }));
    const assignment = await Assignment.create({ title, description, dueDate, submissions });
    const populated = await assignment.populate("submissions.student", "name email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update a single student's submission status
router.patch("/:assignmentId/submission/:studentId", async (req, res) => {
  try {
    const { submitted } = req.body;
    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: req.params.assignmentId,
        "submissions.student": req.params.studentId,
      },
      { $set: { "submissions.$.submitted": submitted } },
      { new: true }
    ).populate("submissions.student", "name email");

    if (!assignment) return res.status(404).json({ error: "Assignment or student not found" });
    res.json(assignment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update assignment details
router.put("/:id", async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { title, description, dueDate },
      { new: true }
    ).populate("submissions.student", "name email");
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.json(assignment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE assignment
router.delete("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
