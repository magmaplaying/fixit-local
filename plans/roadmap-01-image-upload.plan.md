# Configuration

depends_on: "roadmap-00-foundation-hardening.plan.md"

# Plan: roadmap-01-image-upload.plan.md

## Objective

Replace URL-only listing images with real image **upload** so providers can add
photos from their phone/computer. This is the last explicitly-deferred MVP gap
("real image upload") and is a prerequisite for credible listings and good SEO
(real `og:image`s, image cards). Support multiple photos per listing and a
provider avatar.

## Context

Today images are URL-based only: `Listing.photos` is a JSON-encoded string array
(`schema.prisma` line 63) and the listing form (`src/components/listing/
listing-form.tsx` line 109-111) has a single "URL на снимка" text input. Listing
cards (`src/components/listing/listing-card.tsx`) and the detail page
(`src/app/listing/[id]/page.tsx`) render whatever URL is stored.

App is deployed on **Vercel** — Vercel Blob is the path of least resistance for
file storage (no separate bucket/IAM). The provider profile
(`ProviderProfile`) currently has no avatar field. `sharp` is already an
allowed-scripts dependency (`package.json` `allowScripts`), so server-side image
processing is available.

## Implementation Steps

### Step 1: Storage backend

Add `@vercel/blob`. Create `src/lib/storage.ts` wrapping `put()` with a
content-type allowlist (jpeg/png/webp), max-size guard, and a deterministic key
prefix (`listings/{listingId}/...`, `avatars/{userId}/...`). Add the
`BLOB_READ_WRITE_TOKEN` env var to `src/lib/env.ts` (from plan 00). Document the
Vercel Blob setup step.

### Step 2: Upload server action + processing

Create `src/app/_actions/uploads.ts` with an authenticated server action that
accepts a `File` from FormData, optionally downscales/re-encodes to webp with
`sharp` (cap dimensions, strip EXIF), uploads via `storage.ts`, and returns the
public URL. Enforce per-listing photo count limit (e.g. 6). Reuse `requireUser`
from plan 00.

### Step 3: Upload UI in the listing form

Replace the single URL input in `listing-form.tsx` with a client uploader
component `src/components/listing/photo-uploader.tsx`: drag/drop + file picker,
client-side preview, progress, remove, reorder; falls back gracefully and still
allows pasting a URL (keep backward compat with existing seed data). Persist the
resulting array into `Listing.photos` via the existing listing actions
(`src/app/_actions/listings.ts`).

### Step 4: Avatars + rendering

Add `ProviderProfile.avatarUrl String?` (migration). Add avatar upload to
provider onboarding (`src/app/onboarding/provider/page.tsx` + `actions.ts`).
Update `listing-card.tsx`, `listing/[id]/page.tsx`, and `providers/[id]/page.tsx`
to render the first photo / avatar with `next/image` (proper sizing, blur
placeholder), and configure the Blob hostname in `next.config.ts`
`images.remotePatterns`.

### Step 5: Cleanup + limits

On listing delete (and photo removal), best-effort delete the blob. Add a Zod
schema for the photo array in `src/lib/validations.ts`.

## Files to Modify

| File | Action | Description |
| ---- | ------ | ----------- |
| package.json | Modify | Add `@vercel/blob` dependency |
| src/lib/env.ts | Modify | Add `BLOB_READ_WRITE_TOKEN` |
| src/lib/storage.ts | Create | Vercel Blob put/delete wrapper with guards |
| src/app/_actions/uploads.ts | Create | Authenticated upload action + sharp processing |
| src/components/listing/photo-uploader.tsx | Create | Client multi-image uploader w/ preview + reorder |
| src/components/listing/listing-form.tsx | Modify | Swap URL input for uploader |
| src/app/_actions/listings.ts | Modify | Persist photo array; blob cleanup on delete |
| src/app/onboarding/provider/page.tsx | Modify | Avatar upload field |
| src/app/onboarding/provider/actions.ts | Modify | Persist avatar |
| prisma/schema.prisma | Modify | `ProviderProfile.avatarUrl` |
| prisma/migrations/** | Create | Migration for avatarUrl |
| next.config.ts | Modify | Blob hostname in images.remotePatterns |
| src/components/listing/listing-card.tsx | Modify | Render via next/image |
| src/app/listing/[id]/page.tsx | Modify | Photo gallery via next/image |
| src/app/providers/[id]/page.tsx | Modify | Avatar via next/image |
| src/lib/validations.ts | Modify | Photo array schema |

## Standards & Conventions

- Read `node_modules/next/dist/docs/` for `next/image` + `images.remotePatterns`
  config in this Next.js 16 build before wiring images.
- Bulgarian UI copy; cobblestone design tokens.
- Keep backward compatibility with existing URL-based seed photos — do not break
  rows already in Turso.
- Never trust client-reported content-type/size — validate server-side.

## Testing Instructions

1. As a provider, create a listing and upload 2-3 photos from disk; confirm they
   appear on the card and detail gallery, served from the Blob host via
   `next/image`.
2. Upload a non-image / oversized file → rejected with a Bulgarian error.
3. Edit the listing, remove a photo, reorder → persists; blob removed.
4. Existing seed listings (URL photos) still render unbroken.
5. Set an avatar in onboarding → shows on `/providers/[id]`.

## Completion

Update plans/PROGRESS.md to mark this plan as COMPLETED.
