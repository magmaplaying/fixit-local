"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { listingSchema } from "@/lib/validations";
import { parsePhotos } from "@/lib/format";
import { deleteImage } from "@/lib/storage";
import { geocodeArea } from "@/lib/geocode";
import { ensureCanPublish } from "@/lib/provider-gate";

export type ListingFormState = { error?: string };

async function requireProvider() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding/provider");
  return profile;
}

function readForm(formData: FormData) {
  return {
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    priceType: formData.get("priceType"),
    price: formData.get("price"),
    city: formData.get("city"),
    area: formData.get("area") || undefined,
    photos: formData
      .getAll("photos")
      .map((v) => String(v).trim())
      .filter(Boolean),
  };
}

export async function createListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const profile = await requireProvider();
  // The gate lives here, not only in the page — a server action is callable
  // directly, so the page redirect alone would not actually enforce anything.
  if (!(await ensureCanPublish(profile))) {
    return {
      error:
        "За да публикувате обява, първо потвърдете самоличност/фирма и банкова сметка от таблото.",
    };
  }

  const parsed = listingSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Невалидни данни" };

  const d = parsed.data;
  const coords = await geocodeArea(d.area, d.city);
  await prisma.listing.create({
    data: {
      providerId: profile.id,
      categoryId: d.categoryId,
      title: d.title,
      description: d.description,
      priceType: d.priceType,
      price: d.price ?? null,
      city: d.city,
      area: d.area || null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      photos: JSON.stringify(d.photos),
      active: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/services");
  redirect("/dashboard?created=1");
}

export async function updateListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const profile = await requireProvider();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing || existing.providerId !== profile.id) redirect("/dashboard");

  const parsed = listingSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Невалидни данни" };

  const d = parsed.data;
  // Re-geocode only when the location actually changed.
  const locationChanged = existing.city !== d.city || (existing.area ?? null) !== (d.area || null);
  const coordFields = locationChanged
    ? await geocodeArea(d.area, d.city).then((c) => ({
        latitude: c?.lat ?? null,
        longitude: c?.lng ?? null,
      }))
    : {};
  await prisma.listing.update({
    where: { id },
    data: {
      categoryId: d.categoryId,
      title: d.title,
      description: d.description,
      priceType: d.priceType,
      price: d.price ?? null,
      city: d.city,
      area: d.area || null,
      ...coordFields,
      photos: JSON.stringify(d.photos),
      active: formData.get("active") != null,
    },
  });

  // Best-effort: remove blobs that were dropped from the listing.
  const removed = parsePhotos(existing.photos).filter((url) => !d.photos.includes(url));
  await Promise.all(removed.map(deleteImage));

  revalidatePath(`/listing/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/services");
  redirect("/dashboard?updated=1");
}

export async function deleteListing(formData: FormData): Promise<void> {
  const profile = await requireProvider();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (existing && existing.providerId === profile.id) {
    await prisma.listing.delete({ where: { id } });
    // Best-effort: clean up the listing's uploaded blobs.
    await Promise.all(parsePhotos(existing.photos).map(deleteImage));
  }
  revalidatePath("/dashboard");
  revalidatePath("/services");
  redirect("/dashboard?deleted=1");
}
