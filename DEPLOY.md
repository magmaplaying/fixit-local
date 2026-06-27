# Deploying FixIt Local (Vercel + Turso)

Put the app online with a hosted **Turso** database (libSQL — the same engine we use locally) and **Vercel**
hosting. Every service here has a free tier. Budget ~20–30 minutes.

## What you'll need (free accounts)

- **GitHub** — hosts the code
- **Vercel** — hosts the app (you can sign in with GitHub)
- **Turso** — the database

> Why a hosted database? Local dev uses a `dev.db` file. Cloud hosts have no persistent local disk, so the file
> would vanish. Turso is that same SQLite/libSQL engine, hosted — so the app code barely changes.

---

## 1. Push the code to GitHub

1. On <https://github.com/new>, create a new **empty** repo (no README/license) — e.g. `fixit-local`.
2. In the project folder, connect it and push (replace `USER`):
   ```bash
   git remote add origin https://github.com/USER/fixit-local.git
   git push -u origin main
   ```
   Authenticate when prompted (GitHub opens a browser or asks for a personal access token).

---

## 2. Create the Turso database

**Option A — Turso web dashboard (no CLI needed):**
1. Sign up at <https://turso.tech> and create a database (e.g. `fixit-local`).
2. From the database page, copy:
   - the **Database URL** (`libsql://…`) → this is `DATABASE_URL`
   - a **token** (create one) → this is `TURSO_AUTH_TOKEN`
3. Open the database's **SQL shell / console** in the dashboard, then paste and run the entire contents of
   `prisma/migrations/<timestamp>_init/migration.sql` to create the tables.

**Option B — Turso CLI:**
```bash
# install (Windows: `scoop install turso`, or use WSL — see https://docs.turso.tech/cli/installation)
turso auth signup
turso db create fixit-local
turso db show fixit-local --url            # -> DATABASE_URL (libsql://…)
turso db tokens create fixit-local         # -> TURSO_AUTH_TOKEN
# load the schema (one migration file):
turso db shell fixit-local < prisma/migrations/20260627105828_init/migration.sql
```

---

## 3. (Optional) Load the demo data into Turso

Populates the cloud DB with the demo categories/providers/reviews. Skip for an empty production DB.
Run from the project folder with the two values from step 2 (PowerShell):

```powershell
$env:DATABASE_URL="libsql://YOUR-DB.turso.io"; $env:TURSO_AUTH_TOKEN="YOUR-TOKEN"; npm run db:seed
```

---

## 4. Deploy on Vercel

1. Go to <https://vercel.com> → **Add New… → Project** → **Import** your GitHub repo.
2. Vercel auto-detects Next.js. Expand **Environment Variables** and add three:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your Turso `libsql://…` URL |
   | `TURSO_AUTH_TOKEN` | the Turso token |
   | `AUTH_SECRET` | a long random string — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

3. Click **Deploy**. The build runs `prisma generate` (postinstall) then `next build`.
4. Open the Vercel URL when it finishes — your app is live. 🎉

---

## 5. Verify

- Open the URL → home page with listings.
- If you seeded: log in with `customer@demo.bg` / `password123`.
- Walk the loop: browse → request a booking → (as a provider) accept → (as the customer) leave a review.

---

## Updating later

- Every `git push` to `main` auto-deploys a new version on Vercel.
- **Schema changes:** create the migration locally with `npm run db:migrate`, then apply the new
  `migration.sql` to Turso (dashboard SQL console or `turso db shell …`), and push.

## Notes & gotchas

- **`AUTH_SECRET` is required in production** — sessions are signed with it. Never reuse the dev default.
- Free Turso/Vercel tiers are plenty for demos and early users.
- Images load from URLs via plain `<img>`, so no extra Vercel image configuration is needed.
- `@libsql/client` ships platform binaries automatically, so it works on Vercel's Linux runtime with no extra setup.
