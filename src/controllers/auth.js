import { env } from "../config/env.js";
import * as authService from "../services/auth.js";
import {
    asyncHandler,
    ApiError,
    REFRESH_COOKIE,
    refreshCookieOptions,
} from "../utils.js";

const setRefreshCookie = (res, token) => {
    res.cookie(REFRESH_COOKIE, refreshCookieOptions());
};

const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
};

const getMe = (req) => ({
    userAgent: req.headers["user-agent"] || "unkown",
    ip: req.ip || req.socket?.remoteAddress || "unkown",
});

export const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
    const meta = getMe(req);
    const result = await authService.login(req.body, meta);

})

export const requestCode = asyncHandler(async (req, res) => {
    const result = await authService.requestCode(req.body.email);
    res.json(result);
});

export const verifyCode = asyncHandler(async (req, res) => {
    const meta = getMe(req);
    const result = await authService.verifyCode(req.body.email, req.body.code, meta);
    setRefreshCookie(res, result.refreshToken);
    res.json({ accessToken: result.accessToken, user: result.user, isNewUser: result.isNewUser });
});

export const googleStart = asyncHandler(async (req, res) => {

    const next = req.query.next || "/";
    const state = Buffer.from(JSON.stringify({ next }).toString("base64url"));

    const params = new URLSearchParams({
        client_id: env.googleClientId,
        redirect_url: env.googleCallbackUrl,
        scope: "openid email profile",
        state,
        access_type: "offline",
        prompt: "onsent",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

export const googleCallback = asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    if (!code) throw ApiError.badRequest("Missing authiruzation code");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Comntent-Type": "application/json" },
        body: JSON.stringify({
            code,
            client_id: env.googleClientId,
            client_secret: env.googleClientSecret,
            redirect_url: env.googleCallbackUrl,
            grant_type: "authorization_code",
        })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw ApiError.badRequest("Failed to get token from google");

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: { "Authorization": `Bearer ${tokenData.access_token}` }
    });

    const profileData = await profileRes.json();

    const { name, email, picture } = profileData;

    if (!email) throw ApiError.badRequest("Email is required");

    const meta = getMe(req);
    const result = await authService.googleCallback({ name, email, picture }, meta);

    setRefreshCookie(res, result.refreshToken);
    const params = new URLSearchParams({ access: result.accessToken });
    res.redirect(`${env.clientUrl}/auth/google/callback?${params}`);

});

export const githubStart = asyncHandler(async (req, res) => {
    const next = req.query.next || "/";
    const state = Buffer.from(JSON.stringify({ next }).toString("base64url"));

    const params = new URLSearchParams({
        client_id: env.githubClientId,
        redirect_url: env.githubCallbackUrl,
        scope: "user:email",
        state,
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

export const githubCallback = asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    if (!code) throw ApiError.badRequest("Missing authorization code");

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            client_id: env.githubClientId,
            client_secret: env.githubClientSecret,
            code,
            redirect_uri: env.githubCallbackUrl,
        }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw ApiError.badRequest("GitHub token exchange failed");
    // Fetch GitHub profile
    const profileRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/json" },
    });
    const profileData = await profileRes.json();
    // Primary email (in case GitHub profile email is set to private)
    let email = profileData.email;
    if (!email) {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
            headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/json" },
        });
        const emails = await emailsRes.json();
        const primary = emails.find((e) => e.primary && e.verified);
        email = primary?.email || emails[0]?.email || null;
    }
    const meta = getMeta(req);
    const result = await authService.socialLogin({
        provider: "github",
        providerId: String(profileData.id),
        email,
        name: profileData.name || profileData.login,
        avatar: profileData.avatar_url,
        profile: profileData,
    }, meta);
    setRefreshCookie(res, result.refreshToken);
    let next = "/";
    try {
        const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
        next = parsed.next || "/";
    } catch { }
    res.redirect(`${env.clientUrl}${next}?auth=success`);
});

export const refresh = asyncHandler(async (req, res) => {
    const oldToken = req.cookies?.[REFRESH_COOKIE];

    if (!oldToken) throw ApiError.unauthorized("No refresh token provided")

    const meta = getMe(req);
    const result = await authService.refresh(oldToken, meta);

    setRefreshCookie(res, result.refreshToken);
    res.json({ accessToken: result.accessToken });
});

export const logout = asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];

    await authService.logout(token);
    clearRefreshCookie(res);

    res.json({ success: true, message: "Logged out" });
});

export const getMyProfile = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    res.json({ user });
});

export const updateMe = asyncHandler(async (req, res) => {
    const updated = await authService.updateMe(req.user.id, req.body);

    res.json({ user: updated });
});

export const getProviders = asyncHandler(async (req, res) => {
    const providers = await authService.getIdentities(req.user.id);
    res.json({ providers });
});

export const getSessions = asyncHandler(async (req, res) => {
    const sessions = await authService.getSession(req.user._id);
    res.json({ sessions });
});
export const deleteSession = asyncHandler(async (req, res) => {
    await authService.deleteSession(req.params.id, req.user._id);
    res.json({ message: "Session revoked" });
});
export const getIdentities = asyncHandler(async (req, res) => {
    const identities = await authService.getIdentities(req.user._id);
    res.json({ identities });
});
export const unlinkIdentity = asyncHandler(async (req, res) => {
    await authService.unlinkIdentity(req.params.id, req.user._id);
    res.json({ message: "Identity unlinked" });
});
