// Idempotently applies the referrals schema change to the hosted Turso DB.
//
// Prisma generates this migration as a User table-REBUILD, which does NOT apply
// cleanly via the Turso console (see project memory). This makes the same change
// additively: ADD COLUMN + a unique index (SQLite can't ADD a UNIQUE column, so
// the column and its index are created separately). The self-referencing FK is
// omitted — it isn't enforced at the DB level here and the app manages the
// relation. Safe to run against live data and safe to re-run.
//
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"
//   node scripts/apply-referrals-turso.mjs
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !url.startsWith("libsql:")) {
  console.error("✗ Set DATABASE_URL to your Turso libsql:// URL (and TURSO_AUTH_TOKEN).");
  process.exit(1);
}

const c = createClient({ url, authToken });

const cols = await c.execute(`PRAGMA table_info("User")`);
const have = new Set(cols.rows.map((r) => r.name));

if (!have.has("referralCode")) {
  await c.execute(`ALTER TABLE "User" ADD COLUMN "referralCode" TEXT`);
  console.log("✓ Added User.referralCode.");
} else {
  console.log("• User.referralCode already present — skipping.");
}

if (!have.has("referredById")) {
  await c.execute(`ALTER TABLE "User" ADD COLUMN "referredById" TEXT`);
  console.log("✓ Added User.referredById.");
} else {
  console.log("• User.referredById already present — skipping.");
}

// NULLs are distinct in SQLite, so a unique index is safe across existing rows.
await c.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode")`);
console.log("✓ User_referralCode_key unique index ensured.");

const after = await c.execute(`PRAGMA table_info("User")`);
console.log("User columns:", after.rows.map((r) => r.name).join(", "));
