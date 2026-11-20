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

const emailConfigured = () => Boolean(config.email.user && config.email.password);

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: MailOptions): Promise<void> {
  if (!emailConfigured()) {
    // No SMTP credentials — never fail the caller; a dead email pipe must not
    // take down an order or a reset flow. In development the subject line is
    // useful; production stays silent.
    if (config.env !== 'production') {
      console.warn(`[email] SMTP not configured. Suppressed "${options.subject}" to ${options.to}.`);
    }
    return;
  }
  await transport.sendMail({
    from: `"ZOYA GOODS" <${config.email.user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

const escapeHtml = (value: string): string =>
  String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[char] as string);

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value);

const shell = (content: string) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    ${content}
  </div>
`;

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  // Never print the reset token/URL in production (it is a working account
  // takeover link); in development the full URL is useful.
  if (!emailConfigured()) {
    if (config.env !== 'production') {
      console.warn(`[email] SMTP not configured. Password reset link for ${to}: ${resetUrl}`);
    } else {
      console.warn(`[email] SMTP not configured. Password reset suppressed for ${to}.`);
    }
    return;
  }

  await sendEmail({
    to,
    subject: 'Reset Your Password — ZOYA GOODS',
    html: shell(`
      <h2 style="font-weight:400">Reset your password</h2>
      <p style="color:#555">We received a request to reset the password for your ZOYA GOODS account.</p>
      <p style="margin:32px 0">
        <a href="${escapeHtml(resetUrl)}" style="background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;display:inline-block">
          Reset Password
        </a>
      </p>
      <p style="color:#555;font-size:13px">This link is valid for 1 hour. If you did not request this, you can safely ignore this email.</p>
    `),
  });
}

export async function sendOrderConfirmationEmail(options: {
  to: string;
  name: string;
  orderNumber: string;
  itemCount: number;
  total: number;
  currency: string;
  orderUrl: string;
}): Promise<void> {
  await sendEmail({
    to: options.to,
    subject: `Order confirmation ${options.orderNumber.replace(/[\r\n]/g, ' ')} — ZOYA GOODS`,
    html: shell(`
      <h2 style="font-weight:400">Thank you, ${escapeHtml(options.name)}!</h2>
      <p style="color:#555">Your order <strong>${escapeHtml(options.orderNumber)}</strong> (${options.itemCount} item${options.itemCount === 1 ? '' : 's'}, ${money(options.total, options.currency)}) has been received.</p>
      <p style="color:#555">If you chose an online payment, we will email you once the payment is confirmed and your order moves into processing.</p>
      <p style="margin:28px 0">
        <a href="${escapeHtml(options.orderUrl)}" style="background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;display:inline-block">
          View your order
        </a>
      </p>
    `),
  });
}

export async function sendPaymentConfirmationEmail(options: {
  to: string;
  name: string;
  orderNumber: string;
  total: number;
  currency: string;
  orderUrl: string;
}): Promise<void> {
  await sendEmail({
    to: options.to,
    subject: `Payment received for ${options.orderNumber.replace(/[\r\n]/g, ' ')} — ZOYA GOODS`,
    html: shell(`
      <h2 style="font-weight:400">Payment received</h2>
      <p style="color:#555">Hi ${escapeHtml(options.name)}, we received ${money(options.total, options.currency)} for order <strong>${escapeHtml(options.orderNumber)}</strong>. Your order is now confirmed and will begin processing shortly.</p>
      <p style="margin:28px 0">
        <a href="${escapeHtml(options.orderUrl)}" style="background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;display:inline-block">
          Track your order
        </a>
      </p>
    `),
  });
}

export async function sendOrderStatusEmail(options: {
  to: string;
  name: string;
  orderNumber: string;
  status: string;
  orderUrl: string;
}): Promise<void> {
  const human = options.status.replace(/_/g, ' ').toLowerCase();
  await sendEmail({
    to: options.to,
    subject: `Your order ${options.orderNumber.replace(/[\r\n]/g, ' ')} is now ${human} — ZOYA GOODS`,
    html: shell(`
      <h2 style="font-weight:400">Order update</h2>
      <p style="color:#555">Hi ${escapeHtml(options.name)}, your order <strong>${escapeHtml(options.orderNumber)}</strong> is now <strong>${escapeHtml(human)}</strong>.</p>
      <p style="margin:28px 0">
        <a href="${escapeHtml(options.orderUrl)}" style="background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;display:inline-block">
          View your order
        </a>
      </p>
    `),
  });
}

export async function sendContactNotificationEmail(options: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const recipient = config.email.user;
  if (!recipient) return;
  await sendEmail({
    to: recipient,
    subject: `[ZOYA GOODS Contact] ${options.subject.replace(/[\r\n]/g, ' ')}`,
    html: shell(`
      <h2 style="font-weight:400">New contact message</h2>
      <p><strong>From:</strong> ${escapeHtml(options.name)} &lt;${escapeHtml(options.email)}&gt;</p>
      <p><strong>Subject:</strong> ${escapeHtml(options.subject)}</p>
      <div style="border-left:3px solid #000;padding-left:14px;color:#555;white-space:pre-wrap">${escapeHtml(options.message)}</div>
    `),
  });
}

export async function sendManualPaymentEmail(options: {
  to: string;
  name: string;
  orderNumber: string;
  total: number;
  currency: string;
  instructions: string;
  orderUrl: string;
}): Promise<void> {
  await sendEmail({
    to: options.to,
    subject: `How to complete your payment for ${options.orderNumber.replace(/[\r\n]/g, ' ')} — ZOYA GOODS`,
    html: shell(`
      <h2 style="font-weight:400">Almost there, ${escapeHtml(options.name)}</h2>
      <p style="color:#555">Your order <strong>${escapeHtml(options.orderNumber)}</strong> (${money(options.total, options.currency)}) is awaiting payment.</p>
      <p style="color:#555;white-space:pre-line">${escapeHtml(options.instructions)}</p>
      <p style="color:#555">Please include your order number as the payment reference. We will confirm your order once the payment is verified.</p>
      <p style="margin:28px 0">
        <a href="${escapeHtml(options.orderUrl)}" style="background:#000;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;display:inline-block">
          View your order
        </a>
      </p>
    `),
  });
}