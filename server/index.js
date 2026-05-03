require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/students",    require("./routes/students"));
app.use("/attendance",  require("./routes/attendance"));
app.use("/assignments", require("./routes/assignments"));
app.use("/notes",       require("./routes/notes"));

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../client/build");
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => res.json({ status: "API running" }));
}

const PORT      = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/discipleship";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => { console.error("❌ MongoDB failed:", err.message); process.exit(1); });
