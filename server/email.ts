import nodemailer from "nodemailer";

const APP_URL = process.env.APP_URL || "http://localhost:5000";
const FROM = process.env.EMAIL_FROM || "noreply@web3work.io";

function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Fallback: console log in dev
  return {
    sendMail: async (opts: any) => {
      console.log("[Email DEV]", opts.subject, opts.to);
      return { messageId: "dev-" + Date.now() };
    },
  };
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${APP_URL}/api/auth/verify-email?token=${token}`;
  return getTransporter().sendMail({
    from: `"Web3Work" <${FROM}>`,
    to,
    subject: "Verify your Web3Work account",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h1 style="color:#F0B90B;">Welcome to Web3Work</h1>
        <p>Click the button below to verify your email address and start earning in Web3.</p>
        <a href="${link}" style="display:inline-block;background:#F0B90B;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Verify Email
        </a>
        <p style="color:#666;font-size:12px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  return getTransporter().sendMail({
    from: `"Web3Work" <${FROM}>`,
    to,
    subject: "Reset your Web3Work password",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h1 style="color:#F0B90B;">Password Reset</h1>
        <p>You requested to reset your password. Click below to continue:</p>
        <a href="${link}" style="display:inline-block;background:#F0B90B;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#666;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPaymentConfirmationEmail(to: string, amount: number, currency: string, description: string) {
  return getTransporter().sendMail({
    from: `"Web3Work" <${FROM}>`,
    to,
    subject: "Payment Confirmation — Web3Work",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h1 style="color:#F0B90B;">Payment Confirmed ✓</h1>
        <p>Your payment has been successfully processed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #333;font-weight:bold;">Amount</td><td style="padding:8px;border:1px solid #333;">${amount} ${currency}</td></tr>
          <tr><td style="padding:8px;border:1px solid #333;font-weight:bold;">Description</td><td style="padding:8px;border:1px solid #333;">${description}</td></tr>
        </table>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#F0B90B;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}
