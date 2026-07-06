// Idempotently applies the withdrawal-consent column to the hosted Turso DB.
// Unlike the User-table migrations, this one is a plain additive ADD COLUMN
// (Booking has no new unique constraint), so it applies cleanly via the Turso
// console too — this script just makes it safe to re-run and scriptable.
//
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"
//   node scripts/apply-withdrawal-consent-turso.mjs
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !url.startsWith("libsql:")) {
  console.error("✗ Set DATABASE_URL to your Turso libsql:// URL (and TURSO_AUTH_TOKEN).");
  process.exit(1);
}

const c = createClient({ url, authToken });

const cols = await c.execute(`PRAGMA table_info("Booking")`);
const have = new Set(cols.rows.map((r) => r.name));

if (!have.has("withdrawalConsentAt")) {
  await c.execute(`ALTER TABLE "Booking" ADD COLUMN "withdrawalConsentAt" DATETIME`);
  console.log("✓ Added Booking.withdrawalConsentAt.");
} else {
  console.log("• Booking.withdrawalConsentAt already present — skipping.");
}

const after = await c.execute(`PRAGMA table_info("Booking")`);
console.log("Booking columns:", after.rows.map((r) => r.name).join(", "));
