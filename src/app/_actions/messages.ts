"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Send a chat message on a booking. Only the booking's customer or provider may post. */
export async function sendMessage(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookingId = String(formData.get("bookingId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/chat/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { provider: true } } },
  });
  if (!booking) return;

  const isParticipant =
    booking.customerId === user.id || booking.listing.provider.userId === user.id;
  if (!isParticipant) return;

  await prisma.message.create({
    data: { bookingId, senderId: user.id, body: body.slice(0, 2000) },
  });

  revalidatePath(`/chat/${bookingId}`);
  redirect(`/chat/${bookingId}`);
}
