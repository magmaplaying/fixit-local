# Configuration

depends_on: "roadmap-00-foundation-hardening.plan.md"

# Plan: roadmap-04-realtime-notifications.plan.md

## Objective

Make the platform feel alive and bring people back: transactional **email**
notifications (booking requested/accepted/declined/completed, new message,
payment receipt), optional web **push**, and replace the chat's 5-second
`router.refresh()` polling with a leaner near-real-time mechanism. Notifications
are what convert a one-time booking into a habit.

## Context

In-app unread badges already exist (`src/lib/unread.ts`, navbar badges,
`Booking.customerReadAt`/`providerReadAt`). But nothing reaches the user when
they're **not** on the site — no email, no push. Chat
(`src/components/chat/chat-poller.tsx`) polls every 5s with `router.refresh()`,
which is wasteful and won't scale on Vercel.

App is on Vercel. Email via Resend (simple, generous free tier, good DX) is the
recommended choice. Real-time: Server-Sent Events from a route handler, or a
hosted pub/sub (Pusher/Ably) — SSE is cheapest for MVP but watch Vercel function
duration limits; document the trade-off.

This plan depends on plan 00 (env validation, helpers). Payment-receipt emails
are richer if plan 02 shipped, but this plan does not hard-depend on it — guard
those templates behind a feature check.

## Implementation Steps

### Step 1: Email infrastructure

Add `resend` (+ optional `@react-email/components` for templated emails). Add
`RESEND_API_KEY` and `EMAIL_FROM` to `src/lib/env.ts`. Create
`src/lib/email.ts` with a typed `sendEmail({to, subject, react/html})` and a
dev fallback that logs instead of sending when no key is set.

### Step 2: Notification model + preferences

Add a `Notification` model (id, userId, type, payload JSON-text, readAt,
createdAt) for an in-app notification center, and
`User.emailNotifications Boolean @default(true)` for opt-out. Migration. Create a
single `notify(userId, type, payload)` helper in `src/lib/notify.ts` that writes
the row AND dispatches email/push per the user's prefs.

### Step 3: Wire notifications into the flows

Call `notify()` from the booking actions
(`src/app/_actions/bookings.ts`: on request → notify provider; accept/decline/
complete → notify customer), from messages (`src/app/_actions/messages.ts`: new
message → notify the other participant), and from payments (plan 02, guarded).
Bulgarian email templates on-brand.

### Step 4: In-app notification center

Add a bell in the navbar (`src/components/site/navbar.tsx`) with unread count
from `Notification`, and a `/notifications` page listing them with mark-read.
Reuse the unread pattern from `src/lib/unread.ts`.

### Step 5: Real-time chat (replace polling)

Add `src/app/api/chat/[bookingId]/stream/route.ts` as an SSE endpoint (auth +
participant check) that pushes new messages; rewrite `chat-poller.tsx` →
`chat-stream.tsx` to consume `EventSource` and append messages, falling back to
polling if SSE drops. Document the Vercel function-duration caveat and the
Pusher/Ably alternative as a comment.

### Step 6: Web push (optional, behind flag)

Add VAPID-based web push: store subscriptions
(`PushSubscription` model), a `/settings` opt-in, and dispatch from `notify()`.
Keep behind an env flag so it can ship later without blocking the rest.

## Files to Modify

| File | Action | Description |
| ---- | ------ | ----------- |
| package.json | Modify | Add `resend` (+ react-email, web-push optional) |
| src/lib/env.ts | Modify | RESEND_API_KEY, EMAIL_FROM, VAPID keys |
| src/lib/email.ts | Create | Typed send wrapper + dev log fallback |
| src/lib/notify.ts | Create | notify() → DB row + email/push dispatch |
| prisma/schema.prisma | Modify | Notification, PushSubscription models; user prefs |
| prisma/migrations/** | Create | Notifications migration |
| src/app/_actions/bookings.ts | Modify | notify() on each transition |
| src/app/_actions/messages.ts | Modify | notify() on new message |
| src/app/_actions/payments.ts | Modify | Payment-receipt email (guarded; plan 02) |
| src/components/site/navbar.tsx | Modify | Notification bell + count |
| src/app/notifications/page.tsx | Create | In-app notification center |
| src/app/api/chat/[bookingId]/stream/route.ts | Create | SSE stream (auth + participant) |
| src/components/chat/chat-stream.tsx | Create | EventSource consumer, polling fallback |
| src/app/chat/[bookingId]/page.tsx | Modify | Use chat-stream instead of chat-poller |
| src/app/settings/page.tsx | Create | Email/push notification opt-in |

## Standards & Conventions

- Read `node_modules/next/dist/docs/` for **route handlers / streaming
  responses** in this Next.js 16 build before writing the SSE endpoint.
- All email + UI copy in **Bulgarian (Cyrillic)**, on-brand (Playfair/Inter,
  cobblestone palette).
- `notify()` is the single dispatch point — flows never call email/push directly.
- Respect `User.emailNotifications` and push opt-in; provide unsubscribe.
- SSE endpoint must enforce the same participant-only check as the chat page.

## Testing Instructions

1. With `RESEND_API_KEY` set (test domain), request a booking → provider gets an
   email; accept → customer gets an email. Without the key, emails are logged.
2. Send a chat message → the other participant gets an email + an in-app
   notification; bell count increments; `/notifications` lists it; mark-read
   clears it.
3. Open two browsers as the two chat participants → a message from one appears in
   the other's chat within ~1s via SSE, no full refresh; kill the stream →
   polling fallback still delivers.
4. Toggle email notifications off in `/settings` → no emails sent.
5. (If push enabled) opt in, trigger a notification → browser push received.

## Completion

Update plans/PROGRESS.md to mark this plan as COMPLETED.
