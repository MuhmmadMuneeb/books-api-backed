import express from "express";
import dotenv from "dotenv";
import { booksRouter } from "./routes/booksApi.routes.js";
import { userRouter } from "./routes/jwt.routes.js";
import { autherization } from "./middleware/auth.js";
import multer from "multer";
import path from "path";
import cors from "cors";
import serverless from "serverless-http";
import { fileURLToPath } from "url";
import { connectDB } from "./config/database.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Middleware ---
const allowedOrigins = ["http://localhost:5173", "https://your-frontend.vercel.app"];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("CORS policy does not allow access from this origin."), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Remove or comment this line for now, filesystem is read-only in serverless
// app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); 

// --- Routes ---
app.use("/api/students", userRouter);
app.use(autherization);
app.use("/api/books", booksRouter);

// --- Error Handling ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).send("Too many files uploaded");
    return res.status(400).send(`${err.message} ${err.code}`);
  }
  if (err) return res.status(500).send(`${err.message}`);
});

// --- Connect DB on-demand in serverless ---
let isConnected = false;
const connectDBOnce = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
    console.log("Database connected");
  }
};


export default serverless(async (req, res) => {
  await connectDBOnce();
  return app(req, res);
});