// Sets a user's password (bcrypt) directly in the DB — for rotating the demo
// admin credentials on prod without redeploying. Prints no personal data.
//
//   $env:TARGET_EMAIL="admin@demo.bg"; $env:NEW_PASSWORD="…"
//   node scripts/set-user-password.mjs                      # local file:./dev.db
//   + $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"   # Turso
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const email = process.env.TARGET_EMAIL;
const password = process.env.NEW_PASSWORD;
if (!email || !password) {
  console.error("✗ Set TARGET_EMAIL and NEW_PASSWORD env vars.");
  process.exit(1);
}

const c = createClient({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const hash = bcrypt.hashSync(password, 10);
const res = await c.execute({
  sql: `UPDATE "User" SET "passwordHash" = ? WHERE email = ?`,
  args: [hash, email],
});
console.log(`rows updated: ${res.rowsAffected}`);
if (res.rowsAffected !== 1) {
  console.error("✗ Expected exactly 1 row — check TARGET_EMAIL.");
  process.exit(1);
}

// Round-trip check without printing anything sensitive.
const row = await c.execute({
  sql: `SELECT "passwordHash" FROM "User" WHERE email = ?`,
  args: [email],
});
console.log("verify compare:", bcrypt.compareSync(password, row.rows[0].passwordHash));
