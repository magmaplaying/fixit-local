// Idempotently applies the realtime-notifications schema change to the hosted
// Turso (libSQL) production DB.
//
// Why not `setup-turso.mjs` / the Turso web console? Prisma generates this
// migration as a User table-REBUILD (PRAGMA foreign_keys=OFF; CREATE new_User;
// INSERT…SELECT; DROP; RENAME), which does NOT apply cleanly via the console —
// it silently drops columns (see project memory "turso-migration-deploy-gotcha").
// This script makes the SAME change additively and idempotently, so it is safe
// to run against live production data, and safe to re-run.
//
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"
//   node scripts/apply-notifications-turso.mjs
//
// Run this BEFORE `git push` deploys the new code, or the app will 500 on the
// missing table/column until it lands.
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !url.startsWith("libsql:")) {
  console.error("✗ Set DATABASE_URL to your Turso libsql:// URL (and TURSO_AUTH_TOKEN).");
  process.exit(1);
}

const c = createClient({ url, authToken });

// 1. Notification table + index — plain creates, no-op if already present.
await c.executeMultiple(`
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
`);
console.log("✓ Notification table + index ensured.");

// 2. User.emailNotifications — additive ALTER only if the column is missing.
//    SQLite forbids a non-constant default in ADD COLUMN; 1 (=true) is constant.
const cols = await c.execute(`PRAGMA table_info("User")`);
if (cols.rows.some((r) => r.name === "emailNotifications")) {
  console.log("• User.emailNotifications already present — skipping.");
} else {
  await c.execute(`ALTER TABLE "User" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT 1`);
  console.log("✓ Added User.emailNotifications (default 1).");
}

// Verify.
const userCols = await c.execute(`PRAGMA table_info("User")`);
console.log("User columns:", userCols.rows.map((r) => r.name).join(", "));
const notif = await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Notification'");
console.log("Notification table present:", notif.rows.length === 1);
