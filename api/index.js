import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // 1. Added cors import
import { booksRouter } from "../routes/booksApi.routes.js";
import { userRouter } from "../routes/jwt.routes.js";
import { autherization } from "../middleware/auth.js";
import multer from "multer";
import serverless from "serverless-http";
import { connectDB } from "../config/database.js";

dotenv.config();

const app = express();

// ====================
// ✅ CORS (USE PACKAGE)
// ====================
// This handles preflight (OPTIONS) automatically and correctly for Vercel
app.use(cors({
  origin: "*", // Or your specific localhost:5173
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ====================
// ✅ BODY PARSING
// ====================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ====================
// ✅ DATABASE 
// ====================
let isConnected = false;

const connectDBOnce = async () => {
  if (isConnected) return; // Quick exit if already connected
  try {
    await connectDB();
    isConnected = true;
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
};

// Middleware to ensure DB is ready before any request
app.use(async (req, res, next) => {
  // Skip DB connection for preflight requests to speed up CORS checks
  if (req.method === "OPTIONS") return next();
  
  await connectDBOnce();
  next();
});

// ====================
// ✅ ROUTES
// ====================
// Explicitly map your login/signup routes
app.use("/api/students", userRouter);

// Protected routes
app.use(autherization);
app.use("/api/books", booksRouter);

// ====================
// ✅ ERROR HANDLER
// ====================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).send("Too many files uploaded");
    }
    return res.status(400).send(`${err.message} ${err.code}`);
  }
  return res.status(500).send(err.message || "Server Error");
});

// ====================
// ✅ EXPORT
// ====================
export default serverless(app);