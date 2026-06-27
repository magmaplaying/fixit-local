"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";

/** A customer leaves a review for one of their COMPLETED bookings. */
export async function submitReview(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/bookings");

  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) redirect("/bookings");

  const { bookingId, rating, comment } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  // Only the booking's customer, only on a completed booking, only once.
  if (
    !booking ||
    booking.customerId !== user.id ||
    booking.status !== "COMPLETED" ||
    booking.review
  ) {
    redirect("/bookings");
  }

  await prisma.review.create({
    data: {
      bookingId: booking.id,
      listingId: booking.listingId,
      authorId: user.id,
      rating,
      comment: comment || null,
    },
  });

  revalidatePath(`/listing/${booking.listingId}`);
  revalidatePath("/bookings");
  redirect("/bookings?reviewed=1");
}
