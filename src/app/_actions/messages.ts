"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { notify, hasUnreadNotification } from "@/lib/notify";
import { newMessage } from "@/lib/notify-templates";

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

  if (!rateLimit(`msg:${user.id}`, 30, 60_000)) redirect(`/chat/${bookingId}`);

  await prisma.message.create({
    data: { bookingId, senderId: user.id, body: body.slice(0, 2000) },
  });

  // Notify the other participant. Collapse repeats into one feed row, and only
  // email if they don't already have an unread message notice for this chat.
  const recipientId =
    booking.customerId === user.id ? booking.listing.provider.userId : booking.customerId;
  const content = newMessage({ senderName: user.name, body, bookingId });
  const alreadyPinged = await hasUnreadNotification(recipientId, "NEW_MESSAGE", content.href!);
  await notify({ userId: recipientId, ...content, collapse: true, emailable: !alreadyPinged });

  revalidatePath(`/chat/${bookingId}`);
  redirect(`/chat/${bookingId}`);
}
