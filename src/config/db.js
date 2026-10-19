import mongoose from "mongoose";
import { env } from "./env.js";

const connectDb = async function connectDb() {
    try {
        await mongoose.connect(env.mongoUri)
        console.log("Database connected successfully")
    } catch (error) {
        console.log("Error connecting to database :", error)
        process.exit(1);
    }
}

export default connectDb;