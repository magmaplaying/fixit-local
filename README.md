# FixIt Local

A hyperlocal services marketplace — connect customers with vetted local providers (cleaners, handymen,
tutors, movers, plumbers, electricians) in Sofia. MVP built as a custom full-stack web app.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** ORM with the **query compiler** + **libSQL driver adapter**, **SQLite** for local dev
- **Custom auth**: `jose` JWT in an httpOnly cookie + `bcryptjs` password hashing, role-based (CUSTOMER / PROVIDER / ADMIN)
- **Zod** validation, server actions for all mutations

## Getting started

> Requires Node 18+ (developed on Node 24) and npm.

```bash
npm install            # installs deps + runs `prisma generate` (postinstall)
npm run db:migrate     # creates the SQLite db + applies migrations
npm run db:seed        # loads demo categories, providers, listings
npm run dev            # http://localhost:3000
```

Demo accounts (password `password123` for all):
- Provider: `maria@demo.bg`, `georgi@demo.bg`, … (see `prisma/seed.ts`)
- Customer: `customer@demo.bg`

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (typecheck + lint + compile) |
| `npm run db:migrate` | Apply Prisma migrations (creates `dev.db`) |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Drop, re-migrate, and re-seed |
| `npm run db:studio` | Open Prisma Studio to inspect the DB |

## What works today (MVP slice)

- **Auth**: register (as customer or provider), login, logout; protected routes via `src/proxy.ts`.
- **Discovery**: home page (categories + featured), `/services` browse with category + keyword filters, listing detail pages with images + reviews, and public provider profiles (`/providers/[id]`).
- **Provider tools**: onboarding, plus full **listing CRUD** — create, edit, and delete your services (with images) from the dashboard.
- **Booking loop**: a customer can request a booking; the provider accepts / declines / completes it from their dashboard; the customer can cancel, see status in `/bookings`, and leave a ★ review once a booking is completed.

## Not yet built (next sprints)

- Real image **upload** (listings currently take an image URL) — _later_
- Payments / commission (Stripe Connect), in-app chat, maps/geo search, notifications — _Phase 2_
- Production database (Postgres) + deploy — _Phase 2_

## Data model

`User` → `ProviderProfile` → `Listing` → `Booking` → `Review`, plus `Category`.
SQLite has no native enums or array columns, so roles/statuses are validated `String`s and `Listing.photos`
is a JSON-encoded string. See `prisma/schema.prisma`.

## Deployment

To put this online (Vercel + Turso), follow [`DEPLOY.md`](DEPLOY.md). Local dev uses a SQLite file; production
uses a hosted Turso database through the same libSQL adapter, so the app code is unchanged — you just set
`DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `AUTH_SECRET`.

## Project management

Sprint tracking lives in `pm/sprint_data.json` and is analysed with the bundled Scrum Master scripts —
see [`pm/README.md`](pm/README.md).
