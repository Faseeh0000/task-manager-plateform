import { ApiError } from "../utils.js";
import { env } from "../config/env.js";

/**
 * Global error-handling middleware.
 * Must be registered AFTER all routes.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // Handle known ApiError instances
    if (err instanceof ApiError) {
        return res.status(err.status).json({
            error: {
                status: err.status,
                message: err.message,
                ...(err.details && { details: err.details }),
            },
        });
    }

    // Mongoose validation errors
    if (err.name === "ValidationError") {
        const details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return res.status(400).json({
            error: {
                status: 400,
                message: "Validation failed",
                details,
            },
        });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        return res.status(409).json({
            error: {
                status: 409,
                message: `Duplicate value for "${field}"`,
            },
        });
    }

    // Fallback: unexpected error
    const isDev = env.nodeEnv === "development";
    if (isDev) console.error("Unhandled Error:", err);

    res.status(500).json({
        error: {
            status: 500,
            message: isDev ? err.message : "Internal server error",
        },
    });
};

export default errorHandler;
