# Configuration

depends_on: "roadmap-00-foundation-hardening.plan.md"

# Plan: roadmap-03-admin-trust-safety.plan.md

## Objective

Give the platform an operator surface and the trust signals a marketplace needs:
an admin dashboard (the `ADMIN` role already exists but has nowhere to go),
provider verification, content moderation, and basic abuse controls. Without
this, the founder can't run the business, and customers have no reason to trust
strangers in their home.

## Context

`Role` already includes `ADMIN` (`src/lib/auth.ts` line 12) and
`ProviderProfile.verified` exists (`schema.prisma` line 36) but is never set or
surfaced. There is no admin UI, no way to review/suspend users or listings, and
no reporting/flagging. Reviews (`Review` model) are unmoderated. The
denormalized `ratingAvg`/`ratingCount` on `ProviderProfile` are added in plan 00.

This plan depends on plan 00 for `requireRole("ADMIN")` and the role-aware
proxy gating.

## Implementation Steps

### Step 1: Admin shell + access control

Create `/admin` segment guarded by `requireRole("ADMIN")` (proxy matcher +
page guard). Admin layout with nav: Overview, Users, Providers, Listings,
Bookings, Reviews, Reports. Overview shows counts (users by role, listings,
bookings by status, GMV if plan 02 shipped) via Prisma aggregates.

### Step 2: User + provider management

List/search users; view a user; suspend/reactivate (add
`User.status String @default("ACTIVE")` // ACTIVE | SUSPENDED, migration; block
login + actions when suspended). Provider verification queue: review provider
profiles and toggle `verified`; show a "Проверен" badge on `/providers/[id]` and
listing cards when verified.

### Step 3: Listing + review moderation

Admin can deactivate/remove a listing (sets `active=false` or hard delete) with
a reason. Add review flagging: `Review.hidden Boolean @default(false)` +
`Report` model (id, reporterId, targetType [LISTING|REVIEW|USER], targetId,
reason, status [OPEN|RESOLVED|DISMISSED], createdAt). Public "Докладвай" action
on listings/reviews creates a `Report`; admin Reports queue resolves them.

### Step 4: Aggregate ratings + verified trust signals

When a review is created (`src/app/_actions/reviews.ts`), recompute the
provider's `ratingAvg`/`ratingCount` (transaction). Surface stars + count on
listing cards, listing detail, and provider page. Hide reviews where
`hidden=true`.

### Step 5: Rate limiting + guardrails

Add lightweight rate limiting on booking creation, review creation, and message
sending (per-user, time-windowed) to blunt spam/abuse — a simple DB-counter or
in-memory token bucket is fine for MVP scale. Prevent duplicate active bookings
of the same listing by the same customer.

## Files to Modify

| File | Action | Description |
| ---- | ------ | ----------- |
| src/app/admin/layout.tsx | Create | Admin shell + ADMIN guard |
| src/app/admin/page.tsx | Create | Overview with aggregates |
| src/app/admin/users/page.tsx | Create | User list/search/suspend |
| src/app/admin/providers/page.tsx | Create | Verification queue |
| src/app/admin/listings/page.tsx | Create | Listing moderation |
| src/app/admin/reviews/page.tsx | Create | Review moderation |
| src/app/admin/reports/page.tsx | Create | Reports queue |
| src/app/_actions/admin.ts | Create | Suspend, verify, moderate, resolve actions (ADMIN-gated) |
| src/app/_actions/reports.ts | Create | Public report-creation action |
| src/app/_actions/reviews.ts | Modify | Recompute provider ratingAvg/ratingCount; respect hidden |
| prisma/schema.prisma | Modify | User.status, Review.hidden, Report model |
| prisma/migrations/** | Create | Migration for status/hidden/reports |
| src/lib/rate-limit.ts | Create | Simple per-user rate limiter |
| src/app/_actions/bookings.ts | Modify | Rate limit + dedupe active bookings |
| src/app/_actions/messages.ts | Modify | Rate limit messages |
| src/components/listing/listing-card.tsx | Modify | Verified badge + rating stars |
| src/app/providers/[id]/page.tsx | Modify | Verified badge + rating |
| src/app/listing/[id]/page.tsx | Modify | Report action + rating display |

## Standards & Conventions

- Read `node_modules/next/dist/docs/` for segment layouts + middleware matcher
  changes in this Next.js 16 build.
- Every admin action gated by `requireRole("ADMIN")` from plan 00 — never trust
  the client.
- Suspended users must be blocked at the action layer, not just hidden in UI.
- Bulgarian UI copy; cobblestone tokens; statuses map to BG labels like the
  existing `status-badge.tsx`.

## Testing Instructions

1. Non-admin hitting `/admin/**` → redirected; ADMIN sees the dashboard.
2. Suspend a user → that user can no longer log in / take actions; reactivate
   restores access.
3. Verify a provider → "Проверен" badge appears on their page and cards.
4. Report a listing/review as a customer → appears in admin Reports; resolving
   hides/removes the target.
5. Submit a review → provider `ratingAvg`/`ratingCount` update; stars render on
   cards.
6. Rapidly fire booking/review/message requests → rate limiter kicks in; cannot
   create a duplicate active booking on the same listing.

## Completion

Update plans/PROGRESS.md to mark this plan as COMPLETED.
