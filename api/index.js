import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose"; 
import { booksRouter } from "../routes/booksApi.routes.js";
import { userRouter } from "../routes/jwt.routes.js";
import { autherization } from "../middleware/auth.js";
import multer from "multer";
import serverless from "serverless-http";
import { connectDB } from "../config/database.js";

dotenv.config();

const app = express();

// ====================
// ✅ 1. STABLE CORS
// ====================
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ====================
// 📁 2. MULTER CONFIGURATION
// ====================
// For Vercel, we use /tmp because the rest of the file system is read-only
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp"); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// ====================
// ✅ 3. DATABASE & MIDDLEWARE
// ====================
let isConnected = false;

const connectDBOnce = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await connectDB();
    isConnected = true;
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
};

// Preflight and DB check MUST come before Body Parsing
app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(200);
  await connectDBOnce();
  next();
});

// ✅ FIX: Move body parsers AFTER the DB middleware to prevent "BadRequestError"
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ====================
// ✅ 4. ROUTES
// ====================
app.get("/", (req, res) => {
  res.json("This is the API home page");
});

// Auth Routes
app.use("/api/students", userRouter);

// Protected Routes (Example using the upload middleware if needed)
app.use("/api/books", autherization, booksRouter);

// ====================
// ✅ 5. ERROR HANDLER
// ====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(err.message || "Server Error");
});

// ====================
// ✅ 6. EXPORT
// ====================
// If serverless-http continues to give "BadRequestError", 
// you can try: export default app;
export default serverless(app);