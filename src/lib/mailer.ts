import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    throw new Error("SMTP is not configured");
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT is invalid");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass: password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
      disableFileAccess: true,
      disableUrlAccess: true,
      tls: { minVersion: "TLSv1.2" },
    });
  }

  return transporter;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const from = process.env.SMTP_FROM;
  if (!from) {
    throw new Error("SMTP_FROM is not configured");
  }

  try {
    await getTransporter().sendMail({ from, to, subject, html });
  } catch {
    console.error("[mailer] Failed to send email.");
    throw new Error("Email delivery failed");
  }
}

export async function sendResetPasswordEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const appUrl = process.env.BETTER_AUTH_URL;
  if (!appUrl) {
    throw new Error("BETTER_AUTH_URL is not configured");
  }

  const resetLink = new URL(resetUrl);
  if (resetLink.origin !== new URL(appUrl).origin) {
    throw new Error("Reset URL origin does not match the application");
  }

  const safeResetUrl = escapeHtmlAttribute(resetLink.toString());
  const subject = "FPN — Redefinição de palavra-passe";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#1a472a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a472a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#c41e3a;padding:30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;">&#127876; FPN — Fábrica do Pai Natal</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 30px;">
            <h2 style="color:#1a472a;margin-top:0;">Redefinição de palavra-passe</h2>
            <p style="color:#333333;font-size:16px;line-height:1.6;">
              Olá! Recebemos um pedido para redefinir a palavra-passe da sua conta.
            </p>
            <p style="color:#333333;font-size:16px;line-height:1.6;">
              Clique no botão abaixo para criar uma nova palavra-passe:
            </p>
            <p style="text-align:center;margin:30px 0;">
              <a href="${safeResetUrl}"
                 style="background-color:#c41e3a;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:4px;font-size:16px;display:inline-block;">
                Redefinir palavra-passe
              </a>
            </p>
            <p style="color:#333333;font-size:14px;line-height:1.6;">
              Se não fez este pedido, pode ignorar este email.
            </p>
            <p style="color:#333333;font-size:14px;line-height:1.6;">
              Este link expira em 1 hora.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#1a472a;padding:20px;text-align:center;">
            <p style="color:#ffffff;margin:0;font-size:12px;">© 2026 Fábrica do Pai Natal</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail(email, subject, html);
}
