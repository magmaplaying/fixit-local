# Configuration

depends_on: ""

# Plan: roadmap-00-foundation-hardening.plan.md

## Objective

Close the correctness, security, and data-integrity gaps that the rest of the
roadmap will build on top of. This is the load-bearing plan: payments, admin,
and uploads all assume a hardened auth/authorization core and a schema that can
grow. Ship nothing user-facing here beyond a few guardrails — this is about not
building the next four features on sand.

## Context

Stack (see `AGENTS.md` — this is a modified Next.js 16; read
`node_modules/next/dist/docs/` before touching framework APIs): Next.js 16 App
Router + React 19, Prisma 7 (query compiler + libSQL adapter) → Turso in prod /
`file:./dev.db` in dev, custom `jose` JWT + `bcryptjs` auth, Zod, server
actions. Route protection in `src/proxy.ts`; session helpers in
`src/lib/auth.ts`; Prisma client in `src/lib/db.ts`. UI is Bulgarian (Cyrillic).

Current weak points found in the code:

- **`AUTH_SECRET` silently falls back** to `"dev-insecure-secret-change-me"` in
  both `src/lib/auth.ts` (line 8-10) and `src/proxy.ts` (line 5-7). If the env
  var is ever missing in prod, every session is forgeable. There is no
  fail-fast.
- **`src/proxy.ts` only verifies the JWT signature**, not the role. Any logged-in
  user can reach `/dashboard` and `/onboarding/provider` even as a CUSTOMER;
  role gating is ad-hoc inside pages/actions.
- **`setBookingStatus` in `src/app/_actions/bookings.ts`** silently `return`s on
  unauthorized/invalid transitions (no feedback, no logging) and does **not**
  validate the current status before transitioning (e.g. a COMPLETED booking can
  be re-DECLINED). State-machine transitions are not enforced.
- **`requestBooking`** lets a customer book their own listing and does not check
  the listing is `active`.
- **Schema gaps** that later plans need: `Booking` has no `priceQuote`/amount
  field (payments will need one), `Review` has no relation back to the reviewed
  provider for aggregate ratings, and there are no `updatedAt` columns anywhere.
- **No structured error handling / logging** and no `error.tsx` / `not-found.tsx`
  boundaries, so any thrown error in a server component is a raw 500.

## Implementation Steps

### Step 1: Fail-fast on required secrets

Create `src/lib/env.ts` that reads and validates required env vars
(`AUTH_SECRET`, `DATABASE_URL`, and in prod `TURSO_AUTH_TOKEN`) with Zod at
module load, throwing a clear error if missing. Replace the inline
`process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me"` fallbacks in
`src/lib/auth.ts` and `src/proxy.ts` with the validated value. Keep a dev-only
default ONLY when `NODE_ENV !== "production"`, never in prod.

### Step 2: Centralize authorization helpers

Add `requireUser()` and `requireRole(role)` to `src/lib/auth.ts` that
throw/redirect when the check fails, and a `canTransitionBooking(from, to, who)`
pure function encoding the booking state machine
(REQUESTED→ACCEPTED/DECLINED, ACCEPTED→COMPLETED/CANCELLED, etc.). Use it in
`setBookingStatus`. Reject self-booking and inactive-listing booking in
`requestBooking`.

### Step 3: Role-aware route protection

Extend `src/proxy.ts` (or page-level guards if proxy can't read role cheaply —
the JWT already carries `role`, so decode it there) so `/dashboard/**` and
`/onboarding/**` require `role !== "CUSTOMER"` where appropriate, redirecting
with a reason. Confirm the matcher still covers `/chat`, `/bookings`.

### Step 4: Schema evolution + migration

Add to `prisma/schema.prisma`: `Booking.amount Float?` and
`Booking.currency String @default("BGN")` (groundwork for payments),
`updatedAt DateTime @updatedAt` on `User`, `Listing`, `Booking`,
`ProviderProfile`; add `ProviderProfile.ratingAvg Float?` +
`ratingCount Int @default(0)` (denormalized, updated on review create). Generate
a migration; remember libSQL/SQLite has no native enums — keep String + Zod
unions per the existing convention. Apply locally via `npm run db:migrate` and
provide the Turso apply note (`scripts/apply-latest-migration.mjs`).

### Step 5: Error boundaries + minimal logging

Add `src/app/error.tsx`, `src/app/not-found.tsx`, and a per-segment
`error.tsx` for `/dashboard` and `/bookings` (Bulgarian copy, on-brand
cobblestone styling). Add a tiny `src/lib/log.ts` wrapper so server actions log
unauthorized attempts instead of silently returning.

## Files to Modify

| File | Action | Description |
| ---- | ------ | ----------- |
| src/lib/env.ts | Create | Zod-validated required env vars, fail-fast in prod |
| src/lib/auth.ts | Modify | Use validated secret; add requireUser/requireRole helpers |
| src/proxy.ts | Modify | Use validated secret; role-aware gating |
| src/app/_actions/bookings.ts | Modify | State-machine guard, self-book + inactive-listing rejection, logging |
| src/lib/booking-status.ts | Create | `canTransitionBooking` pure state machine + BG label map (extract from status-badge) |
| prisma/schema.prisma | Modify | amount/currency/updatedAt/rating denormalization |
| prisma/migrations/** | Create | New migration for the schema changes |
| src/app/error.tsx | Create | Root error boundary (BG copy) |
| src/app/not-found.tsx | Create | 404 page (BG copy) |
| src/lib/log.ts | Create | Minimal structured server logging |

## Standards & Conventions

- This is a modified Next.js 16 — **read `node_modules/next/dist/docs/`** for
  `error.tsx`/middleware/server-action conventions before coding; do not assume
  training-data behavior.
- SQLite/libSQL: no native enums, no scalar lists — String fields + Zod unions,
  JSON-text for arrays (existing convention in `schema.prisma`).
- All user-facing strings in **Bulgarian (Cyrillic)**; category slugs + roles
  stay ASCII. Match the cobblestone (`cobble-*`) design tokens in `globals.css`.
- Validate every server-action input with Zod (`src/lib/validations.ts`).

## Testing Instructions

1. Unset `AUTH_SECRET` locally and confirm the app refuses to boot in a
   prod-like build (`NODE_ENV=production npm run build`/start) with a clear
   error.
2. As a CUSTOMER, attempt to visit `/dashboard` and `/onboarding/provider` →
   redirected.
3. Try to COMPLETE a booking that is REQUESTED, and DECLINE one that is
   COMPLETED → both rejected; valid transitions still work.
4. Try to book your own listing and an inactive listing → both rejected.
5. `npm run db:migrate` applies cleanly; `npm run db:seed` still works; visiting
   a broken route renders the styled 404, a thrown error renders `error.tsx`.

## Completion

Update plans/PROGRESS.md to mark this plan as COMPLETED.
