import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

// Server-side Stripe client. `null` when STRIPE_SECRET_KEY isn't set so the rest
// of the app degrades gracefully — the booking loop still works unpaid.
export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export function isStripeConfigured(): boolean {
  return stripe !== null;
}

export const COMMISSION_BPS = env.PLATFORM_COMMISSION_BPS;

/** Platform commission (minor units) for a charge `amount` in minor units. */
export function commissionFor(amount: number): number {
  return Math.round((amount * COMMISSION_BPS) / 10000);
}

/** Major → minor units, e.g. 25.5 BGN → 2550. */
export function toMinor(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}

/** Minor → major units, e.g. 2550 → 25.5. */
export function fromMinor(amountMinor: number): number {
  return amountMinor / 100;
}

/** Format a minor-unit amount for display, e.g. 2550 → "25.50 лв.". */
export function formatMoney(amountMinor: number, currency = "BGN"): string {
  const major = fromMinor(amountMinor);
  const suffix = currency === "BGN" ? " лв." : ` ${currency}`;
  return `${major.toFixed(2)}${suffix}`;
}
