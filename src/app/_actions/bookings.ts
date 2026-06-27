"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { bookingSchema } from "@/lib/validations";

/** Customer requests a booking against a listing. */
export async function requestBooking(formData: FormData): Promise<void> {
  const listingId = String(formData.get("listingId") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/listing/${listingId}`);

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

  revalidatePath("/bookings");
  redirect("/bookings?requested=1");
}

const PROVIDER_TRANSITIONS = ["ACCEPTED", "DECLINED", "COMPLETED"];

/** Provider accepts/declines/completes, or customer cancels, a booking. */
export async function setBookingStatus(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookingId = String(formData.get("bookingId") ?? "");
  const status = String(formData.get("status") ?? "");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { provider: true } } },
  });
  if (!booking) return;

  const isProvider = booking.listing.provider.userId === user.id;
  const isCustomer = booking.customerId === user.id;

  const allowed =
    status === "CANCELLED" ? isCustomer || isProvider : isProvider && PROVIDER_TRANSITIONS.includes(status);
  if (!allowed) return;

  await prisma.booking.update({ where: { id: bookingId }, data: { status } });
  revalidatePath("/dashboard");
  revalidatePath("/bookings");
}
