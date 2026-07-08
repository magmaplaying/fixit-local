// Idempotently adds the latitude/longitude columns to Listing + ProviderProfile
// on the hosted Turso DB. Plain additive ADD COLUMNs (no rebuild), so it also
// applies cleanly via the Turso console — this script just makes it scriptable
// and safe to re-run. Run BEFORE deploying the geocoding code (new code reads
// these columns). Backfill coords afterwards with scripts/backfill-geocode.mjs.
//
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"
//   node scripts/apply-geocode-cols-turso.mjs
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !url.startsWith("libsql:")) {
  console.error("✗ Set DATABASE_URL to your Turso libsql:// URL (and TURSO_AUTH_TOKEN).");
  process.exit(1);
}

const c = createClient({ url, authToken });

for (const table of ["Listing", "ProviderProfile"]) {
  const cols = await c.execute(`PRAGMA table_info("${table}")`);
  const have = new Set(cols.rows.map((r) => r.name));
  for (const col of ["latitude", "longitude"]) {
    if (!have.has(col)) {
      await c.execute(`ALTER TABLE "${table}" ADD COLUMN "${col}" REAL`);
      console.log(`✓ Added ${table}.${col}.`);
    } else {
      console.log(`• ${table}.${col} already present — skipping.`);
    }
  }
}
console.log("Done.");
