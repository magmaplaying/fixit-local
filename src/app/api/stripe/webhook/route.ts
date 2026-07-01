import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { notify } from "@/lib/notify";
import { paymentReceived } from "@/lib/notify-templates";

const FEATURE_MS = 7 * 24 * 60 * 60 * 1000;

// Stripe webhook. Verifies the signature against the raw body and reconciles
// payment/payout state. Handlers are idempotent (safe to receive twice).
export async function POST(req: Request): Promise<Response> {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "stripe not configured" }, { status: 503 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const body = await req.text(); // raw body required for signature verification
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn("stripe.webhook.bad_signature", { message: String(err) });
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.metadata?.kind === "booking" && s.metadata.bookingId) {
          await prisma.payment.updateMany({
            where: { bookingId: s.metadata.bookingId },
            data: {
              status: "SUCCEEDED",
              stripePaymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : undefined,
            },
          });
          // Tell the provider the money has arrived.
          const booking = await prisma.booking.findUnique({
            where: { id: s.metadata.bookingId },
            include: { listing: { include: { provider: true } }, payment: true },
          });
          if (booking?.payment) {
            const amountLabel = `${(booking.payment.amount / 100).toFixed(2)} лв.`;
            await notify({
              userId: booking.listing.provider.userId,
              ...paymentReceived({ listingTitle: booking.listing.title, amountLabel }),
            });
          }
        } else if (s.metadata?.kind === "boost" && s.metadata.listingId) {
          await prisma.listing.update({
            where: { id: s.metadata.listingId },
            data: { featuredUntil: new Date(Date.now() + FEATURE_MS) },
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = pi.metadata?.bookingId;
        if (bookingId) {
          await prisma.payment.updateMany({ where: { bookingId }, data: { status: "FAILED" } });
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (pi) {
          await prisma.payment.updateMany({
            where: { stripePaymentIntentId: pi },
            data: { status: "REFUNDED" },
          });
        }
        break;
      }
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        await prisma.providerProfile.updateMany({
          where: { stripeAccountId: acct.id },
          data: { payoutsEnabled: Boolean(acct.charges_enabled && acct.payouts_enabled) },
        });
        break;
      }
    }
  } catch (err) {
    logger.error("stripe.webhook.handler_error", { type: event.type, message: String(err) });
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
