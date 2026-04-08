import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { booksRouter } from "../routes/booksApi.routes.js";
import { userRouter } from "../routes/jwt.routes.js";
import { autherization } from "../middleware/auth.js";
import multer from "multer";
import serverless from "serverless-http";
import { connectDB } from "../config/database.js";

dotenv.config();

const app = express();

// ====================
// ✅ 1. FIXED CORS SECTION
// ====================
app.use(cors({
  origin: "http://localhost:5173", // Exact frontend origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// FIX: Changed "*" to "(.*)" to stop the PathError crash in your logs
app.options("(.*)", cors());

// ====================
// ✅ 2. BODY PARSING
// ====================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ====================
// ✅ 3. DATABASE CONNECTION
// ====================
let isConnected = false;

const connectDBOnce = async () => {
  if (isConnected) return;
  try {
    await connectDB();
    isConnected = true;
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
};

// Middleware to skip DB on preflight to prevent timeouts
app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  await connectDBOnce();
  next();
});

// ====================
// ✅ 4. FIXED ROUTES
// ====================
// Mapping back to /api/students to match your Axios baseURL
app.use("/api/students", userRouter);

// Protected routes
app.use(autherization);
app.use("/api/books", booksRouter);

// ====================
// ✅ 5. ERROR HANDLER
// ====================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).send(`${err.message} ${err.code}`);
  }
  return res.status(500).send(err.message || "Server Error");
});

// ====================
// ✅ 6. EXPORT
// ====================
export default serverless(app);