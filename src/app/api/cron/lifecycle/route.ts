import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runLifecycleCampaigns } from "@/lib/campaigns";
import { logger } from "@/lib/log";

// Daily lifecycle-email cron (scheduled in vercel.json). Vercel invokes this via
// GET with `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
//
// Auth policy (fail-closed): if CRON_SECRET is set, the header must match. If it
// is unset, the endpoint runs only outside production (dev convenience) and is
// disabled in production so it can never be triggered anonymously there.
function authorized(req: Request): boolean {
  if (env.CRON_SECRET) {
    return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
  }
  return process.env.NODE_ENV !== "production";
}

export async function GET(req: Request): Promise<Response> {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await runLifecycleCampaigns();
  logger.info("cron.lifecycle.done", summary);
  return NextResponse.json({ ok: true, ...summary });
}
