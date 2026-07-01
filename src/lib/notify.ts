import { after } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";
import { logger } from "@/lib/log";

/** Every notification kind the app can raise. Stored on `Notification.type`. */
export type NotificationType =
  | "BOOKING_REQUESTED"
  | "BOOKING_ACCEPTED"
  | "BOOKING_DECLINED"
  | "BOOKING_COMPLETED"
  | "BOOKING_CANCELLED"
  | "NEW_MESSAGE"
  | "PAYMENT_RECEIVED";

/** The rendered content of a notification, produced by `notify-templates`. */
export type NotifyContent = {
  type: NotificationType;
  title: string;
  body: string;
  /** App-relative link the notification points at, e.g. `/bookings`. */
  href?: string;
  /** Attempt an email too (still gated by the recipient's preference). Default true. */
  emailable?: boolean;
};

export type NotifyInput = NotifyContent & {
  userId: string;
  /**
   * Fold repeats into one row: if an unread notification of the same type+href
   * already exists, refresh it (and bump it to the top) instead of inserting a
   * new one. Used for chat so a burst of messages is a single feed entry.
   */
  collapse?: boolean;
};

/**
 * Single dispatch point for user notifications. Writes an in-app row
 * synchronously (so it shows on the recipient's next load) and — unless
 * suppressed or opted out — sends an email AFTER the response via `after()`, so
 * the triggering action (booking/message/payment) never waits on the network.
 *
 * Best-effort by design: failures are logged, never thrown, so a notification
 * problem can't break the booking or chat flow that raised it.
 */
export async function notify({ userId, type, title, body, href, emailable = true, collapse }: NotifyInput): Promise<void> {
  try {
    if (collapse && href) {
      const bumped = await prisma.notification.updateMany({
        where: { userId, type, href, readAt: null },
        data: { title, body, createdAt: new Date() },
      });
      if (bumped.count === 0) {
        await prisma.notification.create({ data: { userId, type, title, body, href } });
      }
    } else {
      await prisma.notification.create({
        data: { userId, type, title, body, href: href ?? null },
      });
    }
  } catch (err) {
    logger.error("notify.persist_failed", { userId, type, message: String(err) });
  }

  if (!emailable) return;

  // Read the request host now (allowed before `after`); the email link must be absolute.
  const base = await getBaseUrl().catch(() => "");

  after(async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailNotifications: true },
      });
      if (!user || !user.emailNotifications) return;
      await sendEmail({
        to: user.email,
        subject: title,
        html: renderEmail({ title, body, link: href ? `${base}${href}` : undefined }),
      });
    } catch (err) {
      logger.error("notify.email_failed", { userId, type, message: String(err) });
    }
  });
}

/** Count of a user's unread notifications — drives the navbar bell badge. */
export function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/** A user's notifications, newest first (capped for the notification center). */
export function getNotifications(userId: string, take = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Mark all of a user's unread notifications as read. */
export async function markNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/** True if the user already has an unread notification of `type` pointing at `href`. */
export async function hasUnreadNotification(userId: string, type: NotificationType, href: string): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: { userId, type, href, readAt: null },
    select: { id: true },
  });
  return existing !== null;
}

const BRAND = "Под ръка";
const OCHRE = "#c98a12";
const CREAM = "#faf5ea";
const ESPRESSO = "#211a13";

/** Minimal on-brand HTML email (inline styles — required for mail clients). */
function renderEmail({ title, body, link }: { title: string; body: string; link?: string }): string {
  const button = link
    ? `<a href="${link}" style="display:inline-block;margin-top:20px;background:${OCHRE};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;font-size:15px">Отвори „${BRAND}“</a>`
    : "";
  return `<!doctype html><html lang="bg"><body style="margin:0;background:${CREAM};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${ESPRESSO}">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;margin-bottom:24px">Под <span style="color:${OCHRE}">ръка</span></div>
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:28px">
      <h1 style="margin:0 0 10px;font-size:19px;line-height:1.3">${escapeHtml(title)}</h1>
      <p style="margin:0;font-size:15px;line-height:1.55;color:#4a4036">${escapeHtml(body)}</p>
      ${button}
    </div>
    <p style="margin:20px 2px 0;font-size:12px;line-height:1.5;color:#8a7f70">
      Получавате този имейл, защото имате известия от „${BRAND}“. Можете да ги изключите в настройките на профила си.
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
