import User from "../models/User.js";
import Session from "../models/Session.js";
import Identity from "../models/Identity.js";
import VerificationCode from "../models/VerificationCode.js";
import transporter from "../config/mailer.js";
import { env } from "../config/env.js";
import { ApiError, sha256, randomToken, randomCode, signAccessToken } from "../utils.js";


const createSessionToken = async (user, meta = {}) => {

    const rawRefreshToken = randomToken();
    const tokenHash = sha256(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({
        user: user._id, tokenHash, userAgent: meta.userAgent || null, ip: meta.ip || null, expiresAt,
    });

    const accessToken = signAccessToken(user);
    return {
        accessToken, refreshToken: rawRefreshToken, user: {
            id: user._id,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified,
        }
    };
};

export const register = async ({ email, password, name }) => {
    const existUSer = await User.findOne({ email });
    if (existUSer) throw ApiError.conflict("An account with this email already exists");

    const user = await User.create({
        email, password, name, isEmailVerified: false,
    });
    await requestCode(email);
    return { message: "Registration successful. Please verify the code sent to your email", userId: user._id };

};

export const login = async ({ email, password }, meta = {}) => {
    const user = await User.findOne({ email });
    if (!user || !password) {
        throw ApiError.unauthorized("Invallid email or password")
    };
    const isMatch = user.comparePassword(password);
    if (!isMatch) {
        ;
        throw ApiError.unauthorized("Invallid email or password");
    }

    if (!user.isEmailVerified) {
        throw ApiError.forbidden("Please verify your email before login");
    }
    return createSessionToken(user, meta);
};

export const requestCode = async (email) => {
    const code = randomCode();
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await VerificationCode.deleteMany({ email });

    await VerificationCode.create({ email, codeHash, expiresAt });

    await transporter.sendMail({
        from: env.emailFrom,
        to: email,
        subject: "Verification Code",
        html: `<h2> Your code: <strong>${code}</strong></h2> <p>Code will expires in 10 minitue <p> Thid code expires in 10 minutes </p>`,
    });

    return { message: "Verification code sent to email" };
};

export const verifyCode = async (email, code, meta = {}) => {
    const codeHash = sha256(code);
    const record = await VerificationCode.findOne({
        email, codeHash, expiresAt: { $gt: new Date() }
    });
    if (!record) {
        throw ApiError.badRequest("Invalid or expired verification code");
    }

    await VerificationCode.deleteOne({ _id: record._id });

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
        user = await User.create({ email, isEmailVerified: true });
        isNewUser = true;
    } else if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
    }

    const sessionData = await createSessionToken(user, meta);
    return { ...sessionData, isNewUser };
};

export const socialLogin = async ({ provider, providerId, email, name, avatar, profile }, meta = {}) => {
    let identity = await Identity.findOne({ provider, providerId });
    let user;
    if (identity) {
        user = await User.findById(identity.user);
    } else {
        if (email) {
            user = await User.findOne({ email });
        }
        if (!user) {
            user = await User.create({
                email: email || `${providerId}@${provider}.oauth`,
                name: name || null,
                avatar: avatar || null,
                isEmailVerified: true,
            });
        }
        await Identity.create({
            user: user._id,
            provider,
            providerId,
            profile: profile || {},
        });
    }

    return await createSessionToken(user, meta);
};

export const refreshSession = async (rawRefreshToken, meta = {}) => {
    if (!rawRefreshToken) {
        throw ApiError.unauthorized("Refresh token required");
    }
    const tokenHash = sha256(rawRefreshToken);
    const session = await Session.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
    }).populate("user");

    if (!session || !session.user) {
        throw ApiError.unauthorized("Invalid refresh token");
    }

    await Session.deleteOne({ _id: session._id });

    return await createSessionToken(session.user, meta);

};

export const logout = async (rawRefreshToken) => {
    if (!rawRefreshToken) return;
    const tokenHash = sha256(rawRefreshToken);
    await Session.deleteOne({ tokenHash });
};

export const logoutAll = async (userId) => {
    await Session.deleteMany({ user: userId });
};

export const getSession = async (userId) => {
    return await Session.find({ user: userId }).select("-tokenHash").sort({ createdAt: -1 });
};

export const deleteSession = async (sessionId, userId) => {
    const result = await Session.deleteOne({ _id: sessionId, user: userId });
    if (result.deletedCount === 0) {
        throw ApiError.notFound("Session not found");
    }
};

export const getIdentities = async (userId) => {
    return await Identity.find({ user: userId }).select("provider providerId createdAt");
};

export const unlinkIdentity = async (identityId, userId) => {
    const user = await User.findById(userId);
    const count = await Identity.countDocuments({ user: userId });
    if (!user.password && count <= 1) {
        throw ApiError.badRequest("Cannot unlink the only authentication method for this account");
    }
    const result = await Identity.deleteOne({ _id: identityId, user: userId });
    if (result.deletedCount === 0) {
        throw ApiError.notFound("Identity not found");
    }
};

// ─── Profile & Providers ────────────────────────────────────────────────
export const getMe = async (userId) => {
    return await User.findById(userId).select("-password");
};

export const updateMe = async (userId, data) => {
    return await User.findByIdAndUpdate(userId, data, { new: true }).select("-password");
};

export const getProviders = async (userId) => {
    const user = await User.findById(userId);
    const identities = await Identity.find({ user: userId });
    return {
        hasPassword: !!user.password,
        google: identities.some((i) => i.provider === "google"),
        github: identities.some((i) => i.provider === "github"),
    };
};
