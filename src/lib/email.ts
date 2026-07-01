import { env } from "@/lib/env";
import { logger } from "@/lib/log";

export type SendEmailInput = { to: string; subject: string; html: string; text?: string };

/**
 * Sends a transactional email via Resend's REST API (called with fetch — no SDK
 * dependency, which keeps the bundle lean and dodges the install/approve-scripts
 * gate). When RESEND_API_KEY is unset the message is logged instead of sent, so
 * local dev and unconfigured deploys keep working without failing the action
 * that triggered the notification.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.info("email.logged", { to, subject });
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html, text: text ?? stripHtml(html) }),
    });
    if (!res.ok) {
      logger.error("email.send_failed", {
        to,
        subject,
        status: res.status,
        detail: await res.text().catch(() => ""),
      });
    }
  } catch (err) {
    logger.error("email.send_error", { to, subject, message: String(err) });
  }
}

/** Crude HTML→text fallback for the plaintext part when a caller omits `text`. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
