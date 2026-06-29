# Configuration

depends_on: "roadmap-05-performance-seo-a11y.plan.md"

# Plan: roadmap-06-growth-marketing.plan.md

## Objective

Drive demand and supply: analytics to know what's working, a referral loop to
grow both sides, lifecycle/marketing email, content marketing (blog/guides) for
organic SEO, and conversion polish on the key funnels. This is the
growth/marketing plan — it turns a working, fast, discoverable product into one
that acquires users.

## Context

By this point the product is feature-complete (00-04) and optimised/discoverable
(05). What's missing is the engine that brings people in and brings them back.
There's currently no analytics, no referral mechanism, no marketing email, no
content/SEO articles, and no growth instrumentation on the funnels
(home → search → listing → booking → review).

App on Vercel; email infra (Resend) lands in plan 04 and is reused here for
lifecycle campaigns. SEO foundations (metadata, sitemap, landing pages) land in
plan 05 — content marketing plugs into them.

Depends on plan 05 (SEO/perf foundation). Strongly benefits from plan 04 (email)
and plan 02 (referral payouts/credits) — guard those bits behind feature checks
if those plans haven't shipped.

## Implementation Steps

### Step 1: Analytics + funnel instrumentation

Add privacy-friendly analytics (Vercel Analytics + a lightweight event layer, or
Plausible/PostHog). Create `src/lib/analytics.ts` and instrument key events:
search performed, listing viewed, booking requested, booking completed, review
submitted, provider signup, payment succeeded. Add a minimal funnel view so the
founder can see drop-off. Respect cookie/consent norms (BG/EU).

### Step 2: Referral loop

Add referral codes: `User.referralCode String @unique` and
`User.referredById String?` (migration). Shareable link `/?ref=CODE`; on signup,
attribute the referrer. Reward both sides (account credit if plan 02 shipped, or
a "Проверен по покана" perk / featured-listing credit otherwise). Referral
dashboard widget showing invites + conversions.

### Step 3: Lifecycle + marketing email

Using `src/lib/email.ts` (plan 04), add lifecycle campaigns via a cron/route:
welcome series, "complete your profile" nudge for half-onboarded providers,
re-engagement for dormant customers, post-completion review reminder, weekly new-
listings digest by city. All Bulgarian, on-brand, with unsubscribe + respecting
`User.emailNotifications`. Schedule via Vercel Cron (`vercel.json`).

### Step 4: Content marketing / SEO articles

Add a `/blog` (or `/полезно`) section: MDX or DB-backed articles
(e.g. "Как да изберете майстор", "Цени за почистване в София 2026"), each with
metadata + JSON-LD `Article`, internal links into category/city landing pages
from plan 05, and an RSS feed. This is the durable organic-traffic flywheel.
Wire into the sitemap.

### Step 5: Conversion-rate optimisation

Polish the high-intent funnels: clearer listing CTAs, trust badges
(verified/rating from plan 03) above the fold, social proof on home (counts,
testimonials), a streamlined booking form, and an SEO-friendly FAQ. Add basic
A/B hooks (feature flag or query param) on the home hero CTA to enable iteration.

### Step 6: Sharing + acquisition surfaces

Per-listing and per-provider share buttons (native share + WhatsApp/Viber/
Facebook, popular in BG) with UTM tagging. "Стани изпълнител" supply-side landing
page targeting providers. Optional: structured presence for local directories.

## Files to Modify

| File | Action | Description |
| ---- | ------ | ----------- |
| package.json | Modify | Analytics SDK (Vercel Analytics / PostHog), MDX if used |
| src/lib/analytics.ts | Create | Event tracking wrapper + consent gate |
| src/app/layout.tsx | Modify | Analytics provider + consent banner |
| prisma/schema.prisma | Modify | referralCode, referredById; Article model if DB-backed |
| prisma/migrations/** | Create | Referral (+ article) migration |
| src/app/_actions/referrals.ts | Create | Attribute referral on signup; reward logic |
| src/app/(auth)/actions.ts | Modify | Capture ?ref on register |
| src/app/dashboard/page.tsx | Modify | Referral widget |
| src/lib/campaigns.ts | Create | Lifecycle email definitions |
| src/app/api/cron/lifecycle/route.ts | Create | Cron-triggered campaign sender |
| vercel.json | Create/Modify | Vercel Cron schedule |
| src/app/blog/page.tsx | Create | Article index |
| src/app/blog/[slug]/page.tsx | Create | Article + Article JSON-LD + metadata |
| src/app/blog/rss.xml/route.ts | Create | RSS feed |
| src/app/sitemap.ts | Modify | Include blog + supply landing |
| src/app/become-provider/page.tsx | Create | Supply-side acquisition landing |
| src/app/page.tsx | Modify | Social proof, trust badges, A/B CTA |
| src/components/share/share-buttons.tsx | Create | Share w/ UTM (WhatsApp/Viber/FB) |
| src/app/listing/[id]/page.tsx | Modify | Share buttons, CTA polish |

## Standards & Conventions

- Read `node_modules/next/dist/docs/` for **Vercel Cron / route handlers, MDX,
  and the Metadata API** in this Next.js 16 build before wiring them.
- All marketing copy, articles, and emails in **Bulgarian (Cyrillic)**, on-brand
  (Playfair display / Inter, cobblestone palette). Channels tuned to BG market
  (Viber, Facebook).
- Analytics must respect consent (EU/BG) — no tracking before opt-in; keep it
  privacy-friendly.
- Lifecycle email respects `User.emailNotifications` + unsubscribe (reuse plan
  04's `notify`/email infra). Feature-guard referral credits behind plan 02.
- Tag outbound links with UTMs so plan 06's analytics can attribute them.

## Testing Instructions

1. Trigger each instrumented event (search, view, book, complete, review,
   signup) → events recorded; funnel view shows the chain. No analytics fire
   before consent.
2. Sign up via `/?ref=CODE` → referrer attributed; both sides receive the reward;
   referral dashboard updates.
3. Run the lifecycle cron locally → correct audiences receive the right
   Bulgarian emails; opted-out users excluded; unsubscribe works.
4. Publish an article → renders with `Article` JSON-LD, appears in sitemap + RSS,
   links into category/city pages; Rich Results Test passes.
5. Share a listing via WhatsApp/Viber/FB → URL carries UTMs; landing attributed.
6. Home A/B CTA variant toggles via flag/param; trust badges + social proof show.

## Completion

Update plans/PROGRESS.md to mark this plan as COMPLETED.
