"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canTransitionBooking } from "@/lib/booking-status";
import { logger } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";
import { bookingSchema } from "@/lib/validations";
import { refundIfPaid } from "@/app/_actions/payments";
import { notify } from "@/lib/notify";
import { bookingRequested, bookingStatus, type StatusEvent } from "@/lib/notify-templates";

/** Customer requests a booking against a listing. */
export async function requestBooking(formData: FormData): Promise<void> {
  const listingId = String(formData.get("listingId") ?? "");
  const user = await requireUser(`/listing/${listingId}`);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { provider: true },
  });
  if (!listing || !listing.active) {
    logger.warn("booking.request.unavailable_listing", { userId: user.id, listingId });
    redirect(`/listing/${listingId}?error=unavailable`);
  }
  if (listing.provider.userId === user.id) {
    logger.warn("booking.request.self_booking", { userId: user.id, listingId });
    redirect(`/listing/${listingId}?error=self`);
  }

  if (!rateLimit(`book:${user.id}`, 10, 60_000)) {
    redirect(`/listing/${listingId}?error=rate`);
  }

  // No duplicate active booking of the same listing by the same customer.
  const dupe = await prisma.booking.findFirst({
    where: { listingId, customerId: user.id, status: { in: ["REQUESTED", "ACCEPTED"] } },
    select: { id: true },
  });
  if (dupe) redirect(`/listing/${listingId}?error=duplicate`);

  const parsed = bookingSchema.safeParse({
    listingId,
    message: formData.get("message") || undefined,
    scheduledFor: formData.get("scheduledFor") || undefined,
  });
  if (!parsed.success) redirect(`/listing/${listingId}?error=1`);

  const { message, scheduledFor } = parsed.data;
  await prisma.booking.create({
    data: {
      listingId,
      customerId: user.id,
      message: message || null,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status: "REQUESTED",
    },
  });

  await notify({
    userId: listing.provider.userId,
    ...bookingRequested({ listingTitle: listing.title, customerName: user.name }),
  });

  revalidatePath("/bookings");
  redirect("/bookings?requested=1");
}

/** Provider accepts/declines/completes, or customer cancels, a booking. */
export async function setBookingStatus(formData: FormData): Promise<void> {
  const user = await requireUser();

  const bookingId = String(formData.get("bookingId") ?? "");
  const status = String(formData.get("status") ?? "");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { provider: true } } },
  });
  if (!booking) {
    logger.warn("booking.transition.not_found", { userId: user.id, bookingId });
    return;
  }

  const isProvider = booking.listing.provider.userId === user.id;
  const isCustomer = booking.customerId === user.id;
  if (!isProvider && !isCustomer) {
    logger.warn("booking.transition.forbidden", { userId: user.id, bookingId });
    return;
  }

  const actor = isProvider ? "PROVIDER" : "CUSTOMER";
  if (!canTransitionBooking(booking.status, status, actor)) {
    logger.warn("booking.transition.invalid", {
      userId: user.id,
      bookingId,
      from: booking.status,
      to: status,
      actor,
    });
    return;
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status } });

  // Refund a paid booking when it's cancelled before completion.
  if (status === "CANCELLED") await refundIfPaid(bookingId);

  // Notify the counterparty of the transition (opposite side of the actor).
  await notify({
    userId: isProvider ? booking.customerId : booking.listing.provider.userId,
    ...bookingStatus(status as StatusEvent, {
      listingTitle: booking.listing.title,
      recipient: isProvider ? "CUSTOMER" : "PROVIDER",
    }),
  });

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
}
