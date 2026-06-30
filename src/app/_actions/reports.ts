"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const TARGETS = ["LISTING", "REVIEW", "USER"];

/** Public action: a logged-in user reports a listing/review/user. */
export async function createReport(formData: FormData): Promise<void> {
  const user = await requireUser();
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  const back = String(formData.get("back") ?? "/");

  if (!TARGETS.includes(targetType) || !targetId || reason.length < 3) {
    redirect(`${back}?reported=invalid`);
  }
  if (!rateLimit(`report:${user.id}`, 5, 60_000)) {
    redirect(`${back}?reported=rate`);
  }

  await prisma.report.create({
    data: { reporterId: user.id, targetType, targetId, reason },
  });
  redirect(`${back}?reported=1`);
}
