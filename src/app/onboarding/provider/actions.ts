"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, createSession } from "@/lib/auth";

export async function saveProviderProfile(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding/provider");

  const city = String(formData.get("city") ?? "").trim() || "София";
  const area = String(formData.get("area") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  await prisma.providerProfile.upsert({
    where: { userId: user.id },
    update: { city, area, bio, phone },
    create: { userId: user.id, city, area, bio, phone },
  });

  if (user.role !== "PROVIDER") {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "PROVIDER" },
    });
    // Refresh the session JWT so the new role takes effect immediately.
    await createSession({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: "PROVIDER",
    });
  }

  redirect("/dashboard");
}
