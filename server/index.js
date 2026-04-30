const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/students", require("./routes/students"));
app.use("/attendance", require("./routes/attendance"));
app.use("/assignments", require("./routes/assignments"));
app.use("/notes", require("./routes/notes"));

// Health check
app.get("/", (req, res) => res.json({ status: "Discipleship API running" }));

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/discipleship";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
