# Configuration

depends_on: "roadmap-00-foundation-hardening.plan.md"

# Plan: roadmap-05-performance-seo-a11y.plan.md

## Objective

Make "Под ръка" fast, discoverable, and usable by everyone: performance
(Core Web Vitals, caching, image optimisation, DB query tuning), **SEO**
(metadata, structured data, sitemap, indexable category/city pages), and
**accessibility** (semantic markup, keyboard nav, contrast, screen-reader
labels). This is the optimisation plan and the prerequisite for organic growth
(plan 06).

## Context

The marketplace is content-rich (listings, categories, providers, cities) but
likely has no per-page metadata strategy, no `sitemap.ts`/`robots.ts`, no
JSON-LD, and no systematic a11y pass. Discovery surfaces:
`src/app/page.tsx` (home), `src/app/services/page.tsx` (browse + filters),
`src/app/listing/[id]/page.tsx`, `src/app/providers/[id]/page.tsx`. Fonts are
Cyrillic-capable (Playfair Display / Inter / JetBrains Mono). Cities live in
`src/lib/cities.ts` (10 cities); categories in the DB (`Category` model).

DB runs on Turso (libSQL over HTTP) — round trips are comparatively expensive, so
N+1 queries and over-fetching hurt more than on a local Postgres. Existing
indexes: `Listing(categoryId)`, `Listing(city)`, etc. (`schema.prisma`).

Depends on plan 00 (clean foundation). Benefits from plan 01 (real images →
proper `og:image` and `next/image`), but does not hard-depend on it.

## Implementation Steps

### Step 1: Metadata + Open Graph

Add `generateMetadata` to every public page (home, services, listing, provider,
category, city) with Bulgarian titles/descriptions, canonical URLs, and OG/
Twitter cards. Add a default `metadata` in `src/app/layout.tsx`
(title template, `metadataBase`, locale `bg_BG`). Generate dynamic OG images via
`opengraph-image.tsx` for listings/providers.

### Step 2: Structured data (JSON-LD)

Emit JSON-LD: `LocalBusiness`/`Service` on listing pages, `AggregateRating` +
`Review` when ratings exist (from plan 00/03), `BreadcrumbList`, and
`Organization`/`WebSite` (with SearchAction) on the home page. This is what wins
rich results for local-services queries.

### Step 3: Indexable category + city landing pages

Create real, crawlable routes `/services/[categorySlug]` and
`/services/[citySlug]` (or a combined `/[city]/[category]`) that pre-render the
filtered listings with unique copy and metadata. These are the organic-traffic
workhorses (e.g. "почистване София", "майстор Пловдив"). Add internal links from
home/footer/category directory. Add `src/app/sitemap.ts` (listings, categories,
cities, providers) and `src/app/robots.ts`.

### Step 4: Performance — rendering + caching

Audit each route's rendering mode; make discovery pages statically/ISR-cached
where data allows (`revalidate`), keep auth'd pages dynamic. Ensure `next/image`
everywhere (depends on plan 01 for real images; otherwise optimise the URL
images), set `sizes`, lazy-load below the fold. Subset/preload fonts; eliminate
layout shift on the hero. Add `loading.tsx` skeletons for `/services`,
`/listing/[id]`.

### Step 5: Database query tuning

Eliminate N+1s on `/services` and provider pages (use `select`/`include`
deliberately, batch). Add any missing composite indexes
(e.g. `Listing(city, categoryId)`, `Listing(featuredUntil)` if plan 02 shipped,
`Review(listingId)` already present). Cache category list. Measure query counts
before/after.

### Step 6: Accessibility pass

Semantic landmarks (`header`/`nav`/`main`/`footer`), label every input/icon
button (Bulgarian `aria-label`s), keyboard-operable filters/menus/maps, visible
focus rings, alt text on all images, colour-contrast check on the cobblestone
palette (`globals.css`), skip-to-content link, correct heading hierarchy. Verify
the maps/"near me" and category dropdown are keyboard-accessible.

## Files to Modify

| File | Action | Description |
| ---- | ------ | ----------- |
| src/app/layout.tsx | Modify | Root metadata, metadataBase, lang=bg, fonts preload |
| src/app/page.tsx | Modify | generateMetadata + Organization/WebSite JSON-LD + a11y |
| src/app/services/page.tsx | Modify | Metadata, ISR/caching, query tuning, loading skeleton |
| src/app/services/[categorySlug]/page.tsx | Create | Indexable category landing pages |
| src/app/services/[citySlug]/page.tsx | Create | Indexable city landing pages |
| src/app/listing/[id]/page.tsx | Modify | Metadata + Service/Review JSON-LD + image opt |
| src/app/listing/[id]/opengraph-image.tsx | Create | Dynamic OG image |
| src/app/providers/[id]/page.tsx | Modify | Metadata + JSON-LD + a11y |
| src/app/sitemap.ts | Create | Dynamic sitemap |
| src/app/robots.ts | Create | robots directives |
| src/app/services/loading.tsx | Create | Skeleton |
| src/components/site/navbar.tsx | Modify | a11y: landmarks, aria, focus, skip link |
| src/components/site/footer.tsx | Modify | Internal links to category/city pages |
| src/components/map/location-map.tsx | Modify | Keyboard accessibility |
| prisma/schema.prisma | Modify | Composite indexes |
| prisma/migrations/** | Create | Index migration |
| src/app/globals.css | Modify | Contrast/focus-ring fixes |

## Standards & Conventions

- Read `node_modules/next/dist/docs/` for **Metadata API, `sitemap.ts`,
  `robots.ts`, `opengraph-image`, ISR/`revalidate`, and `loading.tsx`** in this
  Next.js 16 build — these APIs are exactly the ones AGENTS.md warns may differ.
- `lang="bg"`, `locale: "bg_BG"`; all metadata copy in Bulgarian.
- Target green Core Web Vitals (LCP/CLS/INP) on mobile.
- WCAG 2.1 AA: contrast ≥ 4.5:1 for text, keyboard-operable, labelled controls.
- Be conscious of Turso round-trip cost — prefer fewer, well-shaped queries +
  caching over chatty access.

## Testing Instructions

1. Run Lighthouse (mobile) on home, `/services`, a listing, a provider → SEO and
   Accessibility ≥ 95; Performance materially improved; no CLS on hero.
2. Validate JSON-LD in Google's Rich Results Test → Service/LocalBusiness +
   AggregateRating recognised.
3. `/sitemap.xml` and `/robots.txt` resolve and list category/city/listing URLs;
   category/city landing pages render unique metadata and indexable content.
4. Keyboard-only: tab through navbar, filters, category dropdown, map, booking
   form — everything reachable with visible focus; skip-link works.
5. Screen reader spot-check (NVDA): images have alt text, icon buttons announce.
6. Log/measure Prisma query counts on `/services` before vs after → reduced.

## Completion

Update plans/PROGRESS.md to mark this plan as COMPLETED.
