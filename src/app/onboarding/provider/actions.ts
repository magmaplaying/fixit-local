"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, createSession } from "@/lib/auth";
import { deleteImage } from "@/lib/storage";
import { geocodeArea } from "@/lib/geocode";

export async function saveProviderProfile(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding/provider");

  const city = String(formData.get("city") ?? "").trim() || "София";
  const area = String(formData.get("area") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim() || null;

  const existing = await prisma.providerProfile.findUnique({ where: { userId: user.id } });

  // Re-geocode only when the location changed (or is new) — avoids needless
  // Nominatim calls on unrelated edits. null coords → city-center fallback.
  const locationChanged = !existing || existing.city !== city || existing.area !== area;
  const coords = locationChanged ? await geocodeArea(area, city) : null;
  const coordFields = locationChanged
    ? { latitude: coords?.lat ?? null, longitude: coords?.lng ?? null }
    : {};

  await prisma.providerProfile.upsert({
    where: { userId: user.id },
    update: { city, area, bio, phone, avatarUrl, ...coordFields },
    create: { userId: user.id, city, area, bio, phone, avatarUrl, ...coordFields },
  });

  // Best-effort: drop the old avatar blob if it was replaced/removed.
  if (existing?.avatarUrl && existing.avatarUrl !== avatarUrl) {
    await deleteImage(existing.avatarUrl);
  }

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
