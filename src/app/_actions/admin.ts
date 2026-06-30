"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { recomputeProviderRating } from "@/app/_actions/reviews";
import { logger } from "@/lib/log";

const bool = (v: FormDataEntryValue | null) => String(v) === "true";

/** Suspend or reactivate a user (blocks login + actions when suspended). */
export async function setUserStatus(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("userId") ?? "");
  const status = bool(formData.get("suspend")) ? "SUSPENDED" : "ACTIVE";
  await prisma.user.update({ where: { id }, data: { status } });
  logger.info("admin.user.status", { adminId: admin.id, id, status });
  revalidatePath("/admin/users");
}

/** Mark a provider verified / unverified. */
export async function setProviderVerified(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("profileId") ?? "");
  await prisma.providerProfile.update({ where: { id }, data: { verified: bool(formData.get("verified")) } });
  revalidatePath("/admin/providers");
}

/** Show / hide a listing. */
export async function setListingActive(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("listingId") ?? "");
  await prisma.listing.update({ where: { id }, data: { active: bool(formData.get("active")) } });
  revalidatePath("/admin/listings");
  revalidatePath("/services");
}

/** Hide / unhide a review, then recompute the provider's aggregate rating. */
export async function setReviewHidden(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("reviewId") ?? "");
  const review = await prisma.review.update({
    where: { id },
    data: { hidden: bool(formData.get("hidden")) },
    include: { listing: true },
  });
  await recomputeProviderRating(review.listing.providerId);
  revalidatePath("/admin/reviews");
}

/** Resolve or dismiss a report. */
export async function resolveReport(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("reportId") ?? "");
  const status = bool(formData.get("dismiss")) ? "DISMISSED" : "RESOLVED";
  await prisma.report.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reports");
}
