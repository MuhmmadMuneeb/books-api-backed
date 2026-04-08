import express from "express";
import dotenv from "dotenv";
import { booksRouter } from "./routes/booksApi.routes.js";
import { userRouter } from "./routes/jwt.routes.js";
import { autherization } from "./middleware/auth.js";
import multer from "multer";
import cors from "cors";
import serverless from "serverless-http";
import { connectDB } from "./config/database.js";

dotenv.config();

const app = express();


// ====================
// ✅ MIDDLEWARE
// ====================

// 🔥 FIXED CORS (allow all for now)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// 🔥 IMPORTANT: handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// ====================
// ✅ ROUTES
// ====================

// Public routes
app.use("/api/students", userRouter);

// Protected routes
app.use(autherization);
app.use("/api/books", booksRouter);


// ====================
// ✅ ERROR HANDLING
// ====================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).send("Too many files uploaded");
    }
    return res.status(400).send(`${err.message} ${err.code}`);
  }

  if (err) {
    return res.status(500).send(err.message);
  }
});


// ====================
// ✅ DATABASE (SERVERLESS SAFE)
// ====================
let isConnected = false;

const connectDBOnce = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
    console.log("✅ Database connected");
  }
};


// ====================
// ✅ VERCEL HANDLER (MOST IMPORTANT)
// ====================
const serverlessHandler = serverless(app);

export default async function handler(req, res) {
  await connectDBOnce();
  return serverlessHandler(req, res);
}