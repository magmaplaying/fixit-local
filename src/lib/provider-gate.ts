import "server-only";
import type { ProviderProfile } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { logger } from "@/lib/log";

/** The fields the gate needs — keeps callers free to pass a partial select. */
export type GateProfile = Pick<
  ProviderProfile,
  "id" | "stripeAccountId" | "payoutsEnabled" | "verificationExempt"
>;

/**
 * Publishing a listing requires a verified identity/company and a payout
 * account, which Stripe Connect establishes during onboarding (it collects
 * company or individual documents plus a bank account and runs the KYC checks
 * itself — so we never handle those details).
 *
 * Two deliberate escape hatches:
 * - Stripe unconfigured → open. Stripe is optional across this app (the booking
 *   loop works unpaid); gating on it would otherwise make listings impossible
 *   to create in dev or on a deploy without Stripe keys.
 * - `verificationExempt` → open. Providers who joined before this rule keep
 *   publishing; the requirement applies to accounts created after cutover.
 */
export function canPublishListings(profile: GateProfile): boolean {
  if (!isStripeConfigured()) return true;
  return profile.verificationExempt || profile.payoutsEnabled;
}

/**
 * Pull payout status straight from Stripe and persist it.
 *
 * `payoutsEnabled` is normally set by the `account.updated` webhook, but the
 * gate must not depend on webhook delivery — a missed event would lock a
 * verified provider out of publishing with no way to recover from the UI.
 * Call this when a provider has an account but isn't enabled yet; it's a no-op
 * otherwise. Failures are logged and swallowed: a Stripe outage should leave
 * the stored value untouched, not block the page.
 */
export async function syncPayoutStatus(profile: GateProfile): Promise<GateProfile> {
  if (!stripe || !profile.stripeAccountId || profile.payoutsEnabled) return profile;

  try {
    const account = await stripe.accounts.retrieve(profile.stripeAccountId);
    const enabled = Boolean(account.charges_enabled && account.payouts_enabled);
    if (!enabled) return profile;

    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: { payoutsEnabled: true },
    });
    return { ...profile, payoutsEnabled: true };
  } catch (err) {
    logger.error("stripe.payout_sync.failed", {
      profileId: profile.id,
      message: String(err),
    });
    return profile;
  }
}

/** Sync first, then decide — the form of the check every caller actually wants. */
export async function ensureCanPublish(profile: GateProfile): Promise<boolean> {
  return canPublishListings(await syncPayoutStatus(profile));
}
