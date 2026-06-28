// Applies ONLY the latest Prisma migration's SQL to the DATABASE_URL.
// Use to push an incremental schema change to a hosted Turso DB (where
// re-running all migrations would fail on already-existing tables).
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"; node scripts/apply-latest-migration.mjs
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !url.startsWith("libsql:")) {
  console.error("✗ Set DATABASE_URL to your Turso libsql:// URL (and TURSO_AUTH_TOKEN).");
  process.exit(1);
}

const client = createClient({ url, authToken });
const dir = "prisma/migrations";
const migrations = readdirSync(dir)
  .filter((d) => /^\d/.test(d))
  .sort();
const latest = migrations[migrations.length - 1];
const sql = readFileSync(join(dir, latest, "migration.sql"), "utf8");

console.log(`Applying latest migration: ${latest}`);
await client.executeMultiple(sql);
console.log("✓ Applied to Turso.");
