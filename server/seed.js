require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/Student");
const Attendance = require("./models/Attendance");
const Assignment = require("./models/Assignment");
const Note = require("./models/Note");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/discipleship";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    Student.deleteMany(),
    Attendance.deleteMany(),
    Assignment.deleteMany(),
    Note.deleteMany(),
  ]);
  console.log("Cleared existing data");

  // Create students
  const students = await Student.insertMany([
    { name: "James Okonkwo", email: "james@example.com", notes: "Very dedicated, asks great questions." },
    { name: "Miriam Tadesse", email: "miriam@example.com", notes: "Struggles with consistency but has a strong heart." },
    { name: "David Park", email: "david@example.com", notes: "New believer, needs extra encouragement." },
    { name: "Esther Nguyen", email: "esther@example.com", notes: "Leader in the group, helps others." },
    { name: "Samuel Osei", email: "", notes: "" },
  ]);
  console.log(`Created ${students.length} students`);

  // Create attendance sessions
  const buildRecords = (presenceMap) =>
    students.map((s, i) => ({ student: s._id, present: presenceMap[i] }));

  await Attendance.insertMany([
    {
      date: "2024-01-07",
      label: "Week 1 — Introduction",
      records: buildRecords([true, true, true, true, false]),
    },
    {
      date: "2024-01-14",
      label: "Week 2 — The Call",
      records: buildRecords([true, false, true, true, true]),
    },
    {
      date: "2024-01-21",
      label: "Week 3 — Foundations",
      records: buildRecords([true, true, false, true, true]),
    },
    {
      date: "2024-01-28",
      label: "Week 4 — Prayer",
      records: buildRecords([true, true, true, true, true]),
    },
  ]);
  console.log("Created attendance sessions");

  // Create assignments
  const buildSubmissions = (submittedMap) =>
    students.map((s, i) => ({ student: s._id, submitted: submittedMap[i] }));

  await Assignment.insertMany([
    {
      title: "Read Matthew 5–7",
      description: "The Sermon on the Mount. Write one reflection paragraph.",
      dueDate: "2024-01-14",
      submissions: buildSubmissions([true, true, true, true, false]),
    },
    {
      title: "Memorize John 3:16",
      description: "Recite from memory during class.",
      dueDate: "2024-01-21",
      submissions: buildSubmissions([true, false, true, true, true]),
    },
    {
      title: "Personal Prayer Journal — Week 3",
      description: "Record 5 days of prayer entries.",
      dueDate: "2024-01-28",
      submissions: buildSubmissions([true, true, false, true, false]),
    },
  ]);
  console.log("Created assignments");

  // Create progress notes
  await Note.insertMany([
    { student: students[0]._id, text: "James is showing real growth. He led the opening prayer today unprompted." },
    { student: students[0]._id, text: "Great discussion contribution — asked about the role of suffering in faith." },
    { student: students[1]._id, text: "Miriam missed class. Sent her a follow-up text." },
    { student: students[1]._id, text: "She came back this week with a changed attitude. Encouraged her publicly." },
    { student: students[2]._id, text: "David is still finding his footing. Paired him with James for accountability." },
    { student: students[3]._id, text: "Esther volunteered to lead the small group breakout. Excellent leadership." },
    { student: students[4]._id, text: "Samuel was quiet today. Will check in with him one-on-one." },
  ]);
  console.log("Created progress notes");

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
