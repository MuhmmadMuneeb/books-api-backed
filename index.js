import express from "express";
import dotenv from "dotenv";
import { booksRouter } from "./routes/booksApi.routes.js";
import { userRouter } from "./routes/jwt.routes.js";
import { autherization } from "./middleware/auth.js";
import multer from "multer";
import serverless from "serverless-http";
import { connectDB } from "./config/database.js";

dotenv.config();

const app = express();


// ====================
// ✅ CORS (FIXED)
// ====================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});


// ====================
// ✅ BODY PARSING
// ====================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// ====================
// ✅ DATABASE (IMPORTANT FIX)
// ====================
let isConnected = false;

const connectDBOnce = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
    console.log("✅ Database connected");
  }
};

// 🔥 attach DB connection BEFORE routes
app.use(async (req, res, next) => {
  await connectDBOnce();
  next();
});


// ====================
// ✅ ROUTES
// ====================
app.use("/api/students", userRouter);

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
// ✅ EXPORT (FIXED)
// ====================
export default serverless(app);