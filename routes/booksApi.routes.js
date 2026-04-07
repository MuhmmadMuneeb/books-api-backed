import express from "express"
import booksSchema from "../models/books.model.js"
import path from "path"
import fs from "fs"
import multer from "multer"
import { checkAdmin } from "../middleware/auth.js"

export const booksRouter = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + "-" + path.join(file.originalname)
        cb(null, filename)
    },
})

const filefilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true)
    } else {
        cb(null, false)

    }
}

const uploads = multer({
    limits: { fieldSize: 1024 * 1024 * 3 },
    fileFilter: filefilter,
    storage: storage
})


//get all books
booksRouter.get("/", async (req, res) => {
    try {
        const allBooks = await booksSchema.find()
        res.status(200).json(allBooks)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
//get single book
booksRouter.get("/:id", async (req, res) => {
    try {
        const singleBook = await booksSchema.findById(req.params.id)
        if (!singleBook) {
          return  res.status(400).json({ message: "book not found" })
        }
        res.json(singleBook)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
//adding books
booksRouter.post("/", checkAdmin, uploads.single("bookImg"), async (req, res) => {
    try {
        const booksData = new booksSchema(req.body)
        if (req.file) {
            booksData.bookImg = req.file.filename
        }
        const addBook = await booksData.save()
        res.json(addBook)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
//updating books
booksRouter.put("/:id", uploads.single("bookImg"), async (req, res) => {
    try {
        const book = await booksSchema.findById(req.params.id)
        if (!book) {
            return res.status(404).json({ message: "Book not found" })
        }
        if (req.file) {
            if (book.bookImg) {
                const oldPath = path.join("./uploads", book.bookImg)
                fs.unlink(oldPath, (err) => {
                    if (err) console.log("Error deleting old image")
                })
            }

            req.body.bookImg = req.file.filename
        }
        const updatedBook = await booksSchema.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        )
        res.json(updatedBook)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
)

//deleting books
booksRouter.delete("/:id", async (req, res) => {
    try {
        const deleteBook = await booksSchema.findByIdAndDelete(req.params.id)
        if (!deleteBook) {
            return res.status(400).json({ message: "book not found" })
        }
        if (deleteBook.bookImg) {
            const imgpath = path.join("./uploads", deleteBook.bookImg)
            fs.unlink(imgpath, (err) => {
                if (err) {
                    console.log("errr while unlinking")
                }
            })
        }
        res.json(deleteBook)
    } catch (error) {
        console.log("err while deleting")
        res.status(500).json({ message: error.message })

    }
})

