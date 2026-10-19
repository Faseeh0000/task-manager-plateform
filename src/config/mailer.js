import nodemailer from "nodemailer";
import { env } from "./env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

/**
 * Send a 6-digit verification code to the given email.
 */
export const sendVerificationCode = async (email, code) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">Verify your email</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.5;">
        Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.
      </p>
      <div style="background: #f0f4ff; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
      </div>
      <p style="color: #999; font-size: 13px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: env.emailFrom,
    to: email,
    subject: "Your verification code",
    html,
  });
};

export default transporter;
