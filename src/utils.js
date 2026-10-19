import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from './config/env.js';

export class ApiError extends Error {
    constructor(status, message, details) {
        super(message)
        this.status = status;
        this.details;
    }
    static badRequest(msg = 'Bad reuest', details) { return new ApiError(400, msg, details); }
    static unauthorized(msg = 'Unauthorized', details) { return new ApiError(401, msg, details); }
    static forbidden(msg = 'Forbidden', details) { return new ApiError(403, msg, details); }
    static notFound(msg = 'Not Found', details) { return new ApiError(404, msg, details); }
    static conflict(msg = 'Conflict', details) { return new ApiError(409, msg, details); }
    static internalServerError(msg = 'Internal Server Error', details) { return new ApiError(500, msg, details); }
    static paymentRequired(msg = 'Payment required', details) { return new ApiError(402, msg, details); }
}


export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next).catch(next));
    }
}

export const signAccessToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.accessExpires });
}

export const signRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, env.jwtRefreshSecret, { expiresIn: `${env.refreshDays}d` });
};


export const verifyAccessToken = (t) => jwt.verify(t, env.jwtSecret);
export const verifyRefreshToken = (t) => jwt.verify(t, env.jwtRefreshSecret);

export const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');
export const sha256 = hash;
export const randomToken = () => crypto.randomBytes(20).toString('hex');
export const randomCode = () => crypto.randomInt(100_000, 999_999).toString();

export const REFRESH_COOKIE = 'tmc_refresh';
export const refreshCookieOptions = () => ({
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/api/auth'
});

