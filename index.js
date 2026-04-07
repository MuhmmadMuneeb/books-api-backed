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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); // note path adjustment

// --- Public routes ---
app.use("/api/students", userRouter);

// --- Auth middleware for protected routes ---
app.use(autherization);
app.use("/api/books", booksRouter);

// --- Connect to DB ---
await connectDB(); // await works in serverless functions

// --- Error handling ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).send("Error: too many files uploaded");
    }
    return res.status(400).send(`${err.message} ${err.code}`);
  }
  if (err) {
    return res.status(500).send(`${err.message}`);
  }
});

// --- Export as serverless function ---
export const handler = serverless(app);