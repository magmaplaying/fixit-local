# Plan Progress — "Под ръка" (FixIt Local) remaining roadmap

Marketplace MVP is live (auth, discovery, booking loop, reviews, chat, unread
notifications, maps/geo). These plans cover what's left: finishing the product,
optimisation, growth, and monetisation.

Prefix: `roadmap` · Smart parallelism: **disabled** (conservative deps)

## Status

| Plan | Theme | Depends on | Status |
| ---- | ----- | ---------- | ------ |
| roadmap-00-foundation-hardening.plan.md | Security/correctness/schema groundwork | — | ✅ DEPLOYED |
| roadmap-01-image-upload.plan.md | Real image upload (Vercel Blob) | 00 | ✅ DEPLOYED (needs BLOB_READ_WRITE_TOKEN to store uploads; URL fallback works) |
| roadmap-02-payments-monetisation.plan.md | Stripe Connect, commission, featured listings | 00 | ✅ DEPLOYED (Stripe test keys live; Connect enabled) |
| roadmap-03-admin-trust-safety.plan.md | Admin dashboard, verification, moderation | 00 | ✅ DEPLOYED (admin@demo.bg / password123 → /admin) |
| roadmap-04-realtime-notifications.plan.md | Email + push + SSE chat | 00 | ✅ DONE (local) — email (Resend, fetch-based) + in-app notification center + SSE chat. Web push (Step 6) deferred. Needs `RESEND_API_KEY` + Turso migration to deploy |
| roadmap-05-performance-seo-a11y.plan.md | Perf, SEO, accessibility | 00 | ✅ CORE DONE (local) — metadata/OG + Twitter, JSON-LD (Organization/WebSite, Service+AggregateRating, LocalBusiness, Breadcrumb), sitemap.ts + robots.ts, indexable `/services/[slug]` category+city landing pages, footer internal links, a11y (skip link, focus ring, landmarks), `Listing(city,categoryId)` index. Deferred: dynamic OG images, static/ISR (navbar reads cookies → pages dynamic), deeper a11y audit. Set `NEXT_PUBLIC_SITE_URL` + apply index migration to deploy |
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
- **roadmap-04 deploy:** the migration rebuilds the `User` table (fails via the
  Turso console). Before pushing, apply the additive change idempotently:
  `node scripts/apply-notifications-turso.mjs` with `DATABASE_URL`/`TURSO_AUTH_TOKEN`
  set. Set `RESEND_API_KEY` (+ optional `EMAIL_FROM`) in Vercel to send real
  email; without it, emails are logged and everything else works.
- **roadmap-05 deploy:** set `NEXT_PUBLIC_SITE_URL` in Vercel to the **live**
  origin (the `*.vercel.app` URL until `podruka.bg` is attached, then the
  domain) — it drives canonical/OG/sitemap URLs, so a wrong value soft-breaks
  SEO. Apply the index migration (`Listing_city_categoryId_idx` — a plain
  additive `CREATE INDEX`, safe via the Turso console or `setup-turso.mjs`). The
  code doesn't require the index, so pushing before applying it is safe.
