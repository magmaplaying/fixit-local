# Configuration

depends_on: "roadmap-00-foundation-hardening.plan.md"

# Plan: roadmap-02-payments-monetisation.plan.md

## Objective

Turn the marketplace into a business: collect payment for bookings and take a
platform commission. Implement Stripe Connect (destination/marketplace model) so
customers pay through the platform, providers get paid out, and "Под ръка" keeps
a configurable commission. Also lay the groundwork for a secondary revenue lane
(featured/boosted listings). This is the core **monetisation** plan.

## Context

The booking loop exists end-to-end (`src/app/_actions/bookings.ts`:
request → accept/decline/complete → cancel) but is entirely free — no money
moves. `Booking.amount`/`currency` columns are added in plan 00. Listings carry
a `priceType` (HOURLY | FIXED | QUOTE) and optional `price`
(`schema.prisma` lines 59-60), so the charge amount is sometimes known up front
and sometimes a quote. Currency for Bulgaria is **BGN** (note: BG joins the
euro 2026-01-01 — design amounts in minor units and make currency a column, set
default per plan 00).

Stripe Connect is the right model for a marketplace: providers onboard as
connected accounts, the platform creates PaymentIntents with
`application_fee_amount` (the commission) and `transfer_data.destination` (the
provider). Webhooks reconcile async events. App is on Vercel (route handlers for
webhooks).

## Implementation Steps

### Step 1: Stripe setup + env + data model

Add `stripe`. Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `PLATFORM_COMMISSION_BPS` (basis points,
e.g. 1500 = 15%) to `src/lib/env.ts`. Schema additions:
`ProviderProfile.stripeAccountId String?` + `payoutsEnabled Boolean @default(false)`;
new `Payment` model (id, bookingId unique, stripePaymentIntentId, amount,
currency, commissionAmount, status [PENDING|REQUIRES_ACTION|SUCCEEDED|REFUNDED|FAILED],
createdAt/updatedAt). Migration.

### Step 2: Provider payout onboarding

Create `src/lib/stripe.ts` (server-only client). In the provider dashboard add a
"Получаване на плащания" section that creates a Connect account + Account Link
(`src/app/_actions/payments.ts` → `startStripeOnboarding`) and reflects
`payoutsEnabled` from the account's status (via webhook `account.updated`).
Block accepting paid bookings until payouts are enabled.

### Step 3: Checkout on booking acceptance

Decide the charge point: when a provider **ACCEPTS** a booking with a known
price (or sets a quote amount), create a PaymentIntent with
`application_fee_amount = round(amount * commission_bps / 10000)` and
`transfer_data.destination = provider.stripeAccountId`. Customer pays via Stripe
Elements / hosted Checkout on a new `/bookings/[id]/pay` page. Persist `Payment`
+ set `Booking.amount`. For QUOTE listings, let the provider enter the amount at
acceptance.

### Step 4: Webhooks + reconciliation

Add `src/app/api/stripe/webhook/route.ts` (raw-body route handler, verify
signature with `STRIPE_WEBHOOK_SECRET`). Handle
`payment_intent.succeeded` (mark Payment SUCCEEDED, allow booking to proceed to
COMPLETED), `payment_intent.payment_failed`, `charge.refunded`,
`account.updated` (payoutsEnabled). Idempotent on event id.

### Step 5: Refunds, payout states, and UI

Refund on customer cancellation before service (policy: full refund if cancelled
before ACCEPTED-paid window; configurable). Show payment status badges in
`/bookings` and `/dashboard`. Add a simple earnings summary for providers
(gross, commission, net).

### Step 6: Secondary revenue — featured listings (groundwork)

Add `Listing.featuredUntil DateTime?`. Provide a paid "Издигни обявата" action
(one-off PaymentIntent, no Connect transfer — platform keeps 100%) that sets
`featuredUntil`; sort featured listings first in `/services`. Keep the UI minimal
— this is a monetisation lever to expand later.

## Files to Modify

| File | Action | Description |
| ---- | ------ | ----------- |
| package.json | Modify | Add `stripe` (+ `@stripe/stripe-js` for Elements) |
| src/lib/env.ts | Modify | Stripe keys + commission bps |
| src/lib/stripe.ts | Create | Server-side Stripe client |
| prisma/schema.prisma | Modify | Payment model; provider stripe fields; featuredUntil |
| prisma/migrations/** | Create | Payments + connect + featured migration |
| src/app/_actions/payments.ts | Create | Onboarding, PaymentIntent, refund, feature actions |
| src/app/api/stripe/webhook/route.ts | Create | Signed webhook handler, idempotent |
| src/app/bookings/[id]/pay/page.tsx | Create | Customer payment page (Elements/Checkout) |
| src/app/dashboard/page.tsx | Modify | Payout onboarding + earnings summary |
| src/app/bookings/page.tsx | Modify | Payment status, pay CTA |
| src/app/_actions/bookings.ts | Modify | Gate ACCEPT/COMPLETE on payout-enabled + paid |
| src/app/services/page.tsx | Modify | Sort featured listings first |
| src/components/booking/status-badge.tsx | Modify | Payment status labels (BG) |

## Standards & Conventions

- Read `node_modules/next/dist/docs/` for **route handlers + raw body** (webhook
  signature verification needs the unparsed body in this Next.js 16 build).
- Money in **minor units (integers)**; never floats for charges. Currency is a
  column (BGN today; euro transition ahead). Commission as basis points in env.
- Webhook handler MUST verify the Stripe signature and be **idempotent** on event
  id. Never trust client-submitted amounts — compute server-side from the listing
  + quote.
- Bulgarian UI copy; cobblestone tokens. Use Stripe **test mode** keys in dev.
- Reuse `requireUser`/`requireRole` and the booking state machine from plan 00.

## Testing Instructions

1. Provider completes Stripe Connect onboarding in test mode → `payoutsEnabled`
   flips via webhook; can now accept paid bookings.
2. Customer books a FIXED-price listing; provider accepts; customer pays with
   test card `4242…` → PaymentIntent succeeds, `Payment` SUCCEEDED, commission =
   amount × bps; provider sees net in earnings.
3. QUOTE listing: provider sets amount at acceptance → correct charge.
4. Trigger `payment_intent.payment_failed` (card `4000000000000341`) → booking
   not advanced, clear error.
5. Cancel a paid booking in the refund window → `charge.refunded` reflected.
6. "Издигни обявата" payment sets `featuredUntil`; listing sorts first.
7. Webhook replay (same event id twice) → no double-processing.

## Completion

Update plans/PROGRESS.md to mark this plan as COMPLETED.
