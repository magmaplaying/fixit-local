# Plan Progress — "Под ръка" (FixIt Local) remaining roadmap

Marketplace MVP is live (auth, discovery, booking loop, reviews, chat, unread
notifications, maps/geo). These plans cover what's left: finishing the product,
optimisation, growth, and monetisation.

Prefix: `roadmap` · Smart parallelism: **disabled** (conservative deps)

## Status

| Plan | Theme | Depends on | Status |
| ---- | ----- | ---------- | ------ |
| roadmap-00-foundation-hardening.plan.md | Security/correctness/schema groundwork | — | ✅ COMPLETED |
| roadmap-01-image-upload.plan.md | Real image upload (Vercel Blob) | 00 | ✅ COMPLETED |
| roadmap-02-payments-monetisation.plan.md | Stripe Connect, commission, featured listings | 00 | ✅ COMPLETED (needs STRIPE_* keys + Turso migration to go live) |
| roadmap-03-admin-trust-safety.plan.md | Admin dashboard, verification, moderation | 00 | ✅ COMPLETED (local; needs Turso migration to deploy) |
| roadmap-04-realtime-notifications.plan.md | Email + push + SSE chat | 00 | NOT STARTED |
| roadmap-05-performance-seo-a11y.plan.md | Perf, SEO, accessibility | 00 | NOT STARTED |
| roadmap-06-growth-marketing.plan.md | Analytics, referrals, lifecycle, content | 05 | NOT STARTED |

## Execution order (rounds)

- **Round 1:** `roadmap-00-foundation-hardening.plan.md`
- **Round 2 (parallel after 00):** `roadmap-01-image-upload`,
  `roadmap-02-payments-monetisation`, `roadmap-03-admin-trust-safety`,
  `roadmap-04-realtime-notifications`, `roadmap-05-performance-seo-a11y`
- **Round 3 (after 05):** `roadmap-06-growth-marketing`

> Round 2 plans are independent by design but all touch `prisma/schema.prisma`
> and `src/lib/env.ts`. With smart parallelism **disabled**, run them one at a
> time (or coordinate migrations carefully) to avoid migration/merge conflicts.
> Soft sequencing suggestion: 01 → 02 → 03 → 04 → 05.

## Suggested commands

```
/planner:batch --prefix=roadmap
```
or run individually in dependency order.

## Notes / context

- Stack: Next.js 16 (App Router) + React 19, Prisma 7 + libSQL → Turso, custom
  jose JWT auth, Zod, server actions. See `AGENTS.md`: this is a **modified**
  Next.js — read `node_modules/next/dist/docs/` before using framework APIs.
- UI is **Bulgarian (Cyrillic)**; cobblestone (`cobble-*`) design tokens.
- Deployed on Vercel (auto-deploy on push to `main`); Turso prod DB.
