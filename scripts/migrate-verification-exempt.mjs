// One-off production migration for the listing verification gate.
//
// Adds ProviderProfile.verificationExempt and grandfathers every provider that
// already exists at cutover, so the new "verify before publishing" rule only
// applies to accounts created afterwards.
//
// Runs directly against Turso because `prisma migrate deploy` can't reach it and
// scripts/setup-turso.mjs replays every migration from scratch (fine for an
// empty database, destructive against a live one).
//
//   node -r dotenv/config scripts/migrate-verification-exempt.mjs dotenv_config_path=.env.local
//
// Idempotent: the backfill runs only on the pass that adds the column, so a
// second run never grandfathers providers who signed up after cutover.
import { createClient } from "@libsql/client";

const url = process.env.TURSO_PROD_URL ?? process.env.DATABASE_URL;
const authToken = process.env.TURSO_PROD_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

if (!url?.startsWith("libsql:")) {
  console.error("✗ Set TURSO_PROD_URL (libsql://…) and TURSO_PROD_TOKEN.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const columns = await client.execute("PRAGMA table_info('ProviderProfile')");
const alreadyThere = columns.rows.some((r) => r.name === "verificationExempt");

if (alreadyThere) {
  console.log("• verificationExempt already exists — skipping (no backfill).");
} else {
  await client.execute(
    `ALTER TABLE "ProviderProfile" ADD COLUMN "verificationExempt" BOOLEAN NOT NULL DEFAULT false`,
  );
  console.log("✓ Added ProviderProfile.verificationExempt");

  const backfill = await client.execute(`UPDATE "ProviderProfile" SET "verificationExempt" = 1`);
  console.log(`✓ Grandfathered ${backfill.rowsAffected} existing provider(s)`);
}

const summary = await client.execute(`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN "verificationExempt" = 1 THEN 1 ELSE 0 END) AS exempt,
    SUM(CASE WHEN "payoutsEnabled" = 1 THEN 1 ELSE 0 END) AS payouts
  FROM "ProviderProfile"`);
const s = summary.rows[0];
console.log(`\nProviders: ${s.total} total · ${s.exempt} exempt · ${s.payouts} payouts-enabled`);

client.close();
