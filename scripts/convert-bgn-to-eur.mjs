// ONE-TIME data conversion: BGN → EUR at Bulgaria's irrevocable fixed rate
// (1 EUR = 1.95583 BGN). Converts Listing.price, Booking.amount and Payment
// amounts, and sets currency to EUR. Guarded by a marker row so it can never
// run twice on the same DB (a second run would divide by the rate again).
// Works on the local DB or Turso via env:
//
//   node scripts/convert-bgn-to-eur.mjs                              # local
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"; node scripts/convert-bgn-to-eur.mjs
import { createClient } from "@libsql/client";

const RATE = 1.95583;
const c = createClient({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await c.execute(`CREATE TABLE IF NOT EXISTS "_meta" (key TEXT PRIMARY KEY, value TEXT)`);
const done = await c.execute(`SELECT 1 FROM "_meta" WHERE key = 'bgn_to_eur'`);
if (done.rows.length) {
  console.log("• Already converted on this DB — nothing to do.");
  process.exit(0);
}

const l = await c.execute(`UPDATE "Listing" SET price = ROUND(price / ${RATE}, 2) WHERE price IS NOT NULL`);
console.log(`✓ Listing prices converted: ${l.rowsAffected}`);

const bA = await c.execute(`UPDATE "Booking" SET amount = ROUND(amount / ${RATE}, 2) WHERE amount IS NOT NULL`);
const bC = await c.execute(`UPDATE "Booking" SET currency = 'EUR'`);
console.log(`✓ Booking amounts converted: ${bA.rowsAffected}; currency → EUR: ${bC.rowsAffected}`);

const p = await c.execute(
  `UPDATE "Payment" SET amount = CAST(ROUND(amount / ${RATE}) AS INTEGER), commissionAmount = CAST(ROUND(commissionAmount / ${RATE}) AS INTEGER), currency = 'EUR'`,
);
console.log(`✓ Payments converted: ${p.rowsAffected}`);

await c.execute({ sql: `INSERT INTO "_meta" (key, value) VALUES ('bgn_to_eur', ?)`, args: [new Date().toISOString()] });
console.log("✓ Done. Marker set (re-runs are now no-ops).");
