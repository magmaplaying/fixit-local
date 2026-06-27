"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { listingSchema } from "@/lib/validations";

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
    imageUrl: formData.get("imageUrl") || undefined,
  };
}

export async function createListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const profile = await requireProvider();
  const parsed = listingSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const d = parsed.data;
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
      photos: d.imageUrl ? JSON.stringify([d.imageUrl]) : "[]",
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const d = parsed.data;
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
      photos: d.imageUrl ? JSON.stringify([d.imageUrl]) : "[]",
      active: formData.get("active") != null,
    },
  });

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
  }
  revalidatePath("/dashboard");
  revalidatePath("/services");
  redirect("/dashboard?deleted=1");
}
