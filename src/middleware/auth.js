import User from "../models/User.js";
import Session from "../models/Session.js";
import { verifyAccessToken, ApiError, asyncHandler, hash } from "../utils.js";
import { z } from "zod";

/**
 * JWT + Session auth middleware.
 * Verifies the Bearer token, then confirms a matching session exists.
 * Attaches req.user and req.sessionTokenHash.
 */
export const auth = asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer") ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized("Missing access token");

    let payload;
    try {
        payload = verifyAccessToken(token);
    } catch (error) {
        throw ApiError.unauthorized("Invalid or expired access token");
    }

    const user = await User.findById(payload.id);
    if (!user) throw ApiError.unauthorized("User no longer exists");
    if (!user.isActive) throw ApiError.forbidden("Account is deactivated");

    req.user = user;

    // Attach the current session's token hash (used by getSessions to flag isCurrent).
    // We look it up from the refresh cookie if present, so controllers can use it.
    const refreshToken = req.cookies?.tmc_refresh;
    req.sessionTokenHash = refreshToken ? hash(refreshToken) : null;

    next();
});


export const requestCodeSchema = {
    body: z.object({
        email: z.string().email("Invalid email address").toLowerCase().trim(),
    })
};

export const verifyCodeSchema = {
    body: z.object({
        email: z.string().email("Invalid email address").toLowerCase().trim(),
    })
};

export const registerSchema = {
    body: z.object({
        name: z.string().min(2).max(50),
        email: z.string().email(),
        password: z.string(),
    })
};

export const loginSchema = {
    body: z.object({
        email: z.string().email("Invalid email address").trim().toLowerCase(),

    })
};

export const updateMeSchema = {
    body: z.object({
        name: z.string().min(2).max(50),
        avatar: z.string().url("Avatar must be a valid URL").optional(),
    })
};