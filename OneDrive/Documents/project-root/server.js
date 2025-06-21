const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
require("dotenv").config(); // Load .env variables

const app = express();
const PORT = 3000;

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ File model
const fileSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  path: String,
  category: String,
  course: String,
  title: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});
const File = mongoose.model("File", fileSchema);

// ✅ Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(helmet());
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Normalize category name
function normalizeCategory(category) {
  if (category?.toLowerCase().includes("past")) return "Past Papers";
  return category;
}

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = normalizeCategory(req.body.category);
    const { course, title } = req.body;

    const folder = category === "Past Papers"
      ? path.join("uploads", category, course, title)
      : path.join("uploads", category, course);

    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// ✅ Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const { category, course, title } = req.body;
    const normalizedCategory = normalizeCategory(category);

    const file = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      category: normalizedCategory,
      course,
      title
    });

    await file.save();
    res.json({ message: "File uploaded and saved to DB", file });
  } catch (err) {
    console.error("DB Save Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ List files route
app.get("/list-files", async (req, res) => {
  const { category, course, title } = req.query;
  if (!category || !course) return res.status(400).json({ message: "Missing parameters" });

  const query = { category: normalizeCategory(category), course };
  if (title) query.title = title;

  try {
    const files = await File.find(query);
    const urls = files.map(file =>
      file.path.replace(/\\/g, "/").replace("uploads", "/uploads")
    );
    res.json(urls);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json([]);
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
