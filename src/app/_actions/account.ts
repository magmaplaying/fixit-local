"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser, destroySession } from "@/lib/auth";
import { logger } from "@/lib/log";

/**
 * GDPR right to erasure. Permanently deletes the account and, via schema
 * cascades, the personal data attached to it. Requires typing "ИЗТРИЙ" and
 * refuses while bookings are mid-flight so the counterparty isn't orphaned.
 */
export async function deleteAccount(formData: FormData): Promise<void> {
  const user = await requireUser("/settings");

  if (String(formData.get("confirm") ?? "").trim() !== "ИЗТРИЙ") {
    redirect("/settings?delete=confirm");
  }

  const active = await prisma.booking.count({
    where: {
      status: { in: ["REQUESTED", "ACCEPTED"] },
      OR: [{ customerId: user.id }, { listing: { provider: { userId: user.id } } }],
    },
  });
  if (active > 0) redirect("/settings?delete=active");

  await prisma.user.delete({ where: { id: user.id } });
  logger.info("account.deleted", { userId: user.id });

  await destroySession();
  redirect("/?deleted=1");
}
