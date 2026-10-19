import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import errorHandler from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";

const app = express();

// ─── Global middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: env.clientUrl,
    credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Health check ────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API routes ──────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ─── Error handler (must be last) ────────────────────────────────────
app.use(errorHandler);

export default app;
