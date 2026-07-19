import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/log";
import { SITE_URL } from "@/lib/site";
import { signUnsubscribeToken } from "@/lib/unsubscribe";

// Lifecycle / marketing email campaigns, run once daily by the cron route.
//
// Dedupe strategy: no per-send state table (avoids a Turso migration). Each
// campaign targets a *fixed age window* — e.g. "providers created 2 days ago" —
// and the cron runs daily, so every candidate crosses the window exactly once and
// is emailed at most once. Under-sending (skipping) is preferred over spamming.

const HOUR = 60 * 60 * 1000;

const OCHRE = "#c98a12";
const CREAM = "#faf5ea";
const ESPRESSO = "#211a13";

export type CampaignSummary = {
  incompleteProviderNudge: number;
  reviewReminder: number;
};

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** On-brand marketing email with a CTA and a compliant one-click unsubscribe. */
async function renderEmail(opts: {
  userId: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}): Promise<string> {
  const token = await signUnsubscribeToken(opts.userId);
  const unsub = `${SITE_URL}/api/unsubscribe?token=${token}`;
  return `<!doctype html><html lang="bg"><body style="margin:0;background:${CREAM};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${ESPRESSO}">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;margin-bottom:24px">Под <span style="color:${OCHRE}">ръка</span></div>
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:28px">
      <h1 style="margin:0 0 10px;font-size:19px;line-height:1.3">${escapeHtml(opts.heading)}</h1>
      <p style="margin:0;font-size:15px;line-height:1.55;color:#4a4036">${escapeHtml(opts.body)}</p>
      <a href="${opts.ctaHref}" style="display:inline-block;margin-top:20px;background:${OCHRE};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;font-size:15px">${escapeHtml(opts.ctaLabel)}</a>
    </div>
    <p style="margin:20px 2px 0;font-size:12px;line-height:1.5;color:#8a7f70">
      Получавате този имейл, защото имате профил в „Под ръка“.
      <a href="${unsub}" style="color:#8a7f70">Отпишете се</a> или управлявайте известията в настройките.
    </p>
  </div>
</body></html>`;
}

/**
 * Campaign 1 — nudge providers who signed up ~2 days ago but still have no active
 * listing (they can't get bookings without one). Highest-leverage supply activation.
 */
async function runIncompleteProviderNudge(now: Date): Promise<number> {
  const start = new Date(now.getTime() - 72 * HOUR);
  const end = new Date(now.getTime() - 48 * HOUR);

  const providers = await prisma.providerProfile.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      user: { is: { emailNotifications: true, status: "ACTIVE" } },
    },
    select: {
      user: { select: { id: true, email: true, name: true } },
      listings: { where: { active: true }, select: { id: true }, take: 1 },
    },
  });

  let sent = 0;
  for (const p of providers) {
    if (p.listings.length > 0) continue; // already has an active listing — complete
    await sendEmail({
      to: p.user.email,
      subject: "Още сте на крачка — добавете първата си обява",
      html: await renderEmail({
        userId: p.user.id,
        heading: `Здравейте, ${firstName(p.user.name)}!`,
        body: "Профилът ви в „Под ръка“ е готов, но още нямате активна обява — а клиентите намират изпълнители именно през обявите. Добавянето отнема около 2 минути и започвате да получавате заявки.",
        ctaLabel: "Добавете обява",
        ctaHref: `${SITE_URL}/dashboard/listings/new`,
      }),
    });
    sent++;
  }
  return sent;
}

/**
 * Campaign 2 — remind customers who completed a booking ~1 day ago but haven't
 * left a review. Reviews are the platform's social-proof engine.
 */
async function runReviewReminder(now: Date): Promise<number> {
  const start = new Date(now.getTime() - 48 * HOUR);
  const end = new Date(now.getTime() - 24 * HOUR);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: { gte: start, lt: end },
      review: { is: null },
      customer: { is: { emailNotifications: true, status: "ACTIVE" } },
    },
    select: {
      customer: { select: { id: true, email: true, name: true } },
      listing: { select: { title: true } },
    },
  });

  let sent = 0;
  for (const b of bookings) {
    await sendEmail({
      to: b.customer.email,
      subject: "Как мина услугата? Оставете отзив",
      html: await renderEmail({
        userId: b.customer.id,
        heading: `Здравейте, ${firstName(b.customer.name)}!`,
        body: `Наскоро завършихте „${b.listing.title}“ през „Под ръка“. Ще отделите ли минута за кратък отзив? Помагате на другите да изберат по-добре, а на изпълнителя — да расте.`,
        ctaLabel: "Оставете отзив",
        ctaHref: `${SITE_URL}/bookings`,
      }),
    });
    sent++;
  }
  return sent;
}

/** Runs every lifecycle campaign and returns how many emails each sent. */
export async function runLifecycleCampaigns(now = new Date()): Promise<CampaignSummary> {
  const [incompleteProviderNudge, reviewReminder] = await Promise.all([
    runIncompleteProviderNudge(now).catch((err) => {
      logger.error("campaign.provider_nudge_failed", { message: String(err) });
      return 0;
    }),
    runReviewReminder(now).catch((err) => {
      logger.error("campaign.review_reminder_failed", { message: String(err) });
      return 0;
    }),
  ]);
  return { incompleteProviderNudge, reviewReminder };
}
