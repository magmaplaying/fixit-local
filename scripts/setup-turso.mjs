// Applies all Prisma migration SQL files to the database in DATABASE_URL.
// Use for a hosted Turso DB, where `prisma migrate deploy` can't connect directly.
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"; node scripts/setup-turso.mjs
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

for (const m of migrations) {
  const sql = readFileSync(join(dir, m, "migration.sql"), "utf8");
  console.log(`Applying migration ${m}…`);
  await client.executeMultiple(sql);
}

console.log(`✓ Applied ${migrations.length} migration(s) to Turso.`);
