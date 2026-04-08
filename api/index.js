import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose"; // 👈 CRITICAL: Added missing import
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
// ✅ 2. BODY PARSING
// ====================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ====================
// ✅ 3. DATABASE CONNECTION
// ====================
let isConnected = false;

const connectDBOnce = async () => {
  // Now that mongoose is imported, this check will work
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await connectDB();
    isConnected = true;
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
};

app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(200);
  await connectDBOnce();
  next();
});

// ====================
// ✅ 4. ROUTES
// ====================
app.get("/", (req, res) => {
  res.json("This is the API home page");
});

// Use /api prefix here to match your vercel.json rewrites perfectly
app.use("/api/students", userRouter);
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
export default serverless(app);