"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** Toggle whether the current user receives transactional emails. */
export async function setEmailNotifications(formData: FormData): Promise<void> {
  const user = await requireUser("/settings");
  const enabled = String(formData.get("enabled")) === "true";
  await prisma.user.update({ where: { id: user.id }, data: { emailNotifications: enabled } });
  revalidatePath("/settings");
}
