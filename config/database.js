import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () => {
    try {
        // Use await here so the function pauses until connected
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ db connected");
    } catch (error) {
        console.error("❌ db connection error:", error);
        throw error; // Essential for the middleware in index.js to catch it
    }
};