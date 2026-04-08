import express from "express"
export const userRouter = express.Router()
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/jwt.model.js"
import dotenv from "dotenv"
dotenv.config()


userRouter.post("/register", async (req, res) => {
    try {
        const { email, password, username } = req.body
        const userExists = await User.findOne({ $or: [{ email }, { username }] })
        if (userExists) {
            return res.json({ message: "username or email already exists" })
        }
        const hashpassword = await bcrypt.hash(password, 10)
        const newUser = new User({ username, email, password: hashpassword })
        const saveUser = await newUser.save()
        res.status(201).json({ message: "user register sucessfully", user: saveUser })
    } catch (error) {
        res.status(500).json({ message: error.message })

    }
})
userRouter.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body
        const userExists = await User.findOne({ username })
        if (!userExists) {
            return res.status(401).json({ message: "Invalid username or password" })
        }
        const isPasswordVallid = await bcrypt.compare(password, userExists.password)
        if (!isPasswordVallid) {
            return res.status(401).json({ message: "Invalid username or password" })
        }
        const Token = jwt.sign({ userID: userExists._id, username: userExists.username }, process.env.SECRET_KEY, { expiresIn: "24h" })

        res.json({ message: "login sucessfully", Token, username: userExists.username })


    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
userRouter.post("/logout", (req, res) => {
    try {
        res.json({ message: "logged out successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})