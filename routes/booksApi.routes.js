import express from "express";
import booksSchema from "../models/books.model.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import { checkAdmin } from "../middleware/auth.js";

export const booksRouter = express.Router();

// ====================
// 📁 MULTER STORAGE (Vercel Compatible)
// ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Vercel only allows writing to /tmp
    const uploadPath = process.env.NODE_ENV === "production" ? "/tmp" : "./uploads";

    // Create local folder if it doesn't exist (for local dev only)
    if (process.env.NODE_ENV !== "production" && !fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Clean filename: remove spaces and add timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanFileName = file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueSuffix + "-" + cleanFileName);
  },
});

const filefilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

const uploads = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: filefilter,
});

// ====================
// 🚀 ROUTES
// ====================

// 1. GET ALL BOOKS
booksRouter.get("/", async (req, res) => {
  try {
    const allBooks = await booksSchema.find().sort({ createdAt: -1 });
    res.status(200).json(allBooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. ADD NEW BOOK
booksRouter.post("/add", checkAdmin, uploads.single("bookImg"), async (req, res) => {
  try {
    const booksData = new booksSchema({
      ...req.body,
      bookImg: req.file ? req.file.filename : null,
    });
    
    const addBook = await booksData.save();
    res.status(201).json(addBook);
  } catch (error) {
    res.status(500).json({ message: "Server Error: " + error.message });
  }
});

// 3. DELETE BOOK
booksRouter.delete("/:id", checkAdmin, async (req, res) => {
  try {
    const deleteBook = await booksSchema.findByIdAndDelete(req.params.id);
    if (!deleteBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Safely delete file if it exists
    if (deleteBook.bookImg) {
      const uploadPath = process.env.NODE_ENV === "production" ? "/tmp" : "./uploads";
      const imgPath = path.join(uploadPath, deleteBook.bookImg);
      
      if (fs.existsSync(imgPath)) {
        fs.unlink(imgPath, (err) => {
          if (err) console.error("Unlink Error:", err);
        });
      }
    }
    res.json({ message: "Book deleted successfully", deleteBook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. UPDATE BOOK
booksRouter.put("/:id", checkAdmin, uploads.single("bookImg"), async (req, res) => {
  try {
    const book = await booksSchema.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    let updateData = { ...req.body };

    if (req.file) {
      // Delete old image if new one is uploaded
      if (book.bookImg) {
        const uploadPath = process.env.NODE_ENV === "production" ? "/tmp" : "./uploads";
        const oldPath = path.join(uploadPath, book.bookImg);
        if (fs.existsSync(oldPath)) {
            fs.unlink(oldPath, (err) => { if (err) console.log(err); });
        }
      }
      updateData.bookImg = req.file.filename;
    }

    const updatedBook = await booksSchema.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});