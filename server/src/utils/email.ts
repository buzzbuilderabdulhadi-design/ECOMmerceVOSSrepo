import nodemailer from 'nodemailer';
import config from '../config';

// ============================================================
// Email Sending Utility — Nodemailer with SMTP config
// ============================================================

const transport = nodemailer.createTransport({
  service: config.email.service || 'smtp',
  host: config.email.service ? undefined : 'smtp.gmail.com',
  port: config.email.service ? undefined : 587,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!config.email.user || !config.email.password) {
    // No SMTP credentials configured — log instead of crashing the request
    console.warn(`[email] SMTP not configured. Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await transport.sendMail({
    from: `"ZOYA GOODS" <${config.email.user}>`,
    to,
    subject: 'Reset Your Password — ZOYA GOODS',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="font-weight:400">Reset your password</h2>
        <p style="color:#555">We received a request to reset the password for your ZOYA GOODS account.</p>
        <p style="margin:32px 0">
          <a href="${resetUrl}" style="background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;display:inline-block">
            Reset Password
          </a>
        </p>
        <p style="color:#555;font-size:13px">This link is valid for 1 hour. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}