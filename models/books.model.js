import mongoose, { Types } from "mongoose";

const BooksApiSchema = mongoose.Schema({
    bookTitle: { type: String, require: true, },
    price: { type: Number, required: true, },
    desc: { type: String, required: true, },
    bookImg: { type: String },

})

const booksSchema = mongoose.model("booksapischema", BooksApiSchema)
export default booksSchema
