import { env } from "./config/env.js";
import connectDb from "./config/db.js";
import app from "./app.js";

const start = async () => {
    try {
        await connectDb();
        console.log("✅ MongoDB connected");

        app.listen(env.port, () => {
            console.log(`🚀 Server running on http://localhost:${env.port}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

start();
