import { Router } from "express";
import { authLimiter } from "../middleware/rateLimit.js";
import * as auth from "../controllers/auth.js";
import { validate } from "../middleware/validate.js";
import { requestCodeSchema, verifyCodeSchema, updateMeSchema, registerSchema, loginSchema } from "../middleware/auth.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), auth.register);
router.post("/login", authLimiter, validate(loginSchema), auth.login);
router.post("/email/request-code", authLimiter, validate(requestCodeSchema), auth.requestCode);
router.post("/email/verify-code", authLimiter, validate(verifyCodeSchema), auth.verifyCode);

router.get("/google", auth.googleStart);
router.get("/google/callback", auth.googleCallback);
router.get("/github", auth.githubStart);
router.get("/github/callback", auth.githubCallback);
// ─── 3. Session Refresh & Logout ─────────────────────────────────────
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);
// ─── 4. Protected Routes (Require Access Token) ──────────────────────
//router.use(auth); // Everything below requires login!
router.post("/logout-all", auth.logout);
// Profile
router.get("/me", auth.getMyProfile);
router.patch("/me", validate(updateMeSchema), auth.updateMe);
router.get("/providers", auth.getProviders);
// Device Sessions
router.get("/sessions", auth.getSessions);
router.delete("/sessions/:id", auth.deleteSession);
// Linked Social Accounts
router.get("/identities", auth.getIdentities);
router.delete("/identities/:id", auth.unlinkIdentity);
export default router;
