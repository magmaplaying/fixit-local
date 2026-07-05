// Points the demo listings' photos at the topical images in public/seed/
// (replacing the old random picsum URLs) without touching anything else in
// the DB. Matches listings via provider email, so it's safe on live data and
// safe to re-run. Works against the local dev DB and hosted Turso alike:
//
//   node scripts/update-seed-photos.mjs                         # local (file:./prisma/dev.db)
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"
//   node scripts/update-seed-photos.mjs                         # Turso
import { createClient } from "@libsql/client";

// file:./dev.db resolves against the cwd — run from the project root.
const url = process.env.DATABASE_URL ?? "file:./dev.db";
const c = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

const PHOTOS = {
  "maria@demo.bg": "cleaning-home.jpg",
  "georgi@demo.bg": "handyman.jpg",
  "ivan@demo.bg": "plumbing.jpg",
  "elena@demo.bg": "tutoring.jpg",
  "dimitar@demo.bg": "moving.jpg",
  "svetlin@demo.bg": "electrical.jpg",
  "petya@demo.bg": "cleaning-office.jpg",
  "nikolay@demo.bg": "painting.jpg",
  "stefan@demo.bg": "ac.jpg",
  "viktoria@demo.bg": "gardening.jpg",
  "martin@demo.bg": "it.jpg",
};

for (const [email, file] of Object.entries(PHOTOS)) {
  const res = await c.execute({
    sql: `UPDATE "Listing" SET photos = ?
          WHERE "providerId" IN (
            SELECT p.id FROM "ProviderProfile" p
            JOIN "User" u ON u.id = p."userId"
            WHERE u.email = ?
          )`,
    args: [JSON.stringify([`/seed/${file}`]), email],
  });
  console.log(`${res.rowsAffected ? "✓" : "•"} ${email} → /seed/${file} (${res.rowsAffected} listing)`);
}

const left = await c.execute(`SELECT COUNT(*) AS n FROM "Listing" WHERE photos LIKE '%picsum%'`);
console.log(`Listings still on picsum: ${left.rows[0].n}`);
