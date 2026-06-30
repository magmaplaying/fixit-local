"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canTransitionBooking } from "@/lib/booking-status";
import { logger } from "@/lib/log";
import { stripe, commissionFor, toMinor } from "@/lib/stripe";

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Provider: create/continue a Stripe Connect Express account for payouts. */
export async function startStripeOnboarding(): Promise<void> {
  const user = await requireUser("/dashboard");
  if (!stripe) redirect("/dashboard?stripe=unconfigured");

  const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/onboarding/provider");

  let accountId = profile.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({ type: "express", email: user.email });
    accountId = account.id;
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: { stripeAccountId: accountId },
    });
  }

  const base = await getBaseUrl();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/dashboard?stripe=refresh`,
    return_url: `${base}/dashboard?stripe=connected`,
    type: "account_onboarding",
  });
  redirect(link.url);
}

/**
 * Provider accepts a booking. If Stripe is configured, the provider's payouts
 * are enabled, and an amount is set, this records a pending Payment so the
 * customer can pay; otherwise the booking is accepted free (graceful).
 */
export async function acceptBookingWithPayment(formData: FormData): Promise<void> {
  const user = await requireUser();
  const bookingId = String(formData.get("bookingId") ?? "");
  const amountMajor = Number(formData.get("amount") ?? "");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { provider: true } } },
  });
  if (!booking) return;
  if (booking.listing.provider.userId !== user.id) {
    logger.warn("payment.accept.forbidden", { userId: user.id, bookingId });
    return;
  }
  if (!canTransitionBooking(booking.status, "ACCEPTED", "PROVIDER")) return;

  const provider = booking.listing.provider;
  const charge = stripe && provider.payoutsEnabled && Number.isFinite(amountMajor) && amountMajor > 0;

  if (charge) {
    const amount = toMinor(amountMajor);
    await prisma.$transaction([
      prisma.booking.update({ where: { id: bookingId }, data: { status: "ACCEPTED", amount: amountMajor } }),
      prisma.payment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          amount,
          currency: booking.currency,
          commissionAmount: commissionFor(amount),
          status: "PENDING",
        },
        update: { amount, commissionAmount: commissionFor(amount), status: "PENDING" },
      }),
    ]);
  } else {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "ACCEPTED" } });
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
}

/** Customer: open Stripe Checkout to pay for an accepted booking. */
export async function startBookingCheckout(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!stripe) redirect("/bookings?stripe=unconfigured");

  const bookingId = String(formData.get("bookingId") ?? "");
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { provider: true } }, payment: true },
  });
  if (!booking || booking.customerId !== user.id || !booking.payment) redirect("/bookings");
  if (booking.payment.status === "SUCCEEDED") redirect("/bookings");
  const destination = booking.listing.provider.stripeAccountId;
  if (!destination) redirect("/bookings?stripe=provider");

  const base = await getBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: booking.payment.currency.toLowerCase(),
          product_data: { name: booking.listing.title },
          unit_amount: booking.payment.amount,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: booking.payment.commissionAmount,
      transfer_data: { destination },
      metadata: { bookingId },
    },
    metadata: { kind: "booking", bookingId },
    success_url: `${base}/bookings?paid=1`,
    cancel_url: `${base}/bookings?cancelled=1`,
  });

  await prisma.payment.update({ where: { bookingId }, data: { status: "REQUIRES_ACTION" } });
  redirect(session.url ?? "/bookings");
}

/** Provider: pay to feature a listing for 7 days (platform keeps 100%). */
export async function startBoostCheckout(formData: FormData): Promise<void> {
  const user = await requireUser("/dashboard");
  if (!stripe) redirect("/dashboard?stripe=unconfigured");

  const listingId = String(formData.get("listingId") ?? "");
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { provider: true },
  });
  if (!listing || listing.provider.userId !== user.id) redirect("/dashboard");

  const base = await getBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bgn",
          product_data: { name: `Издигане на „${listing.title}" (7 дни)` },
          unit_amount: 1000, // 10.00 BGN
        },
        quantity: 1,
      },
    ],
    metadata: { kind: "boost", listingId },
    success_url: `${base}/dashboard?boosted=1`,
    cancel_url: `${base}/dashboard`,
  });
  redirect(session.url ?? "/dashboard");
}

/** Best-effort refund of a succeeded payment (used when a booking is cancelled). */
export async function refundIfPaid(bookingId: string): Promise<void> {
  if (!stripe) return;
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment || payment.status !== "SUCCEEDED" || !payment.stripePaymentIntentId) return;
  try {
    await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
    await prisma.payment.update({ where: { bookingId }, data: { status: "REFUNDED" } });
  } catch (err) {
    logger.error("payment.refund.failed", { bookingId, message: String(err) });
  }
}
