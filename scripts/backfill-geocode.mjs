// Backfills latitude/longitude on existing ProviderProfile + Listing rows by
// geocoding their "area, city" via OSM Nominatim. Idempotent (only touches rows
// with a neighbourhood and null coords) and rate-limited to 1 req/sec per the
// Nominatim usage policy. Works on the local DB or Turso via env:
//
//   node scripts/backfill-geocode.mjs                              # local
//   $env:DATABASE_URL="libsql://…"; $env:TURSO_AUTH_TOKEN="…"; node scripts/backfill-geocode.mjs
import { createClient } from "@libsql/client";

const c = createClient({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(area, city) {
  const q = `${area}, ${city}, България`;
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q,
    format: "jsonv2",
    limit: "1",
    countrycodes: "bg",
  })}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "PodRuka/1.0 (https://www.podruka.bg)",
      "Accept-Language": "bg",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const hit = data[0];
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

const TABLES = ["ProviderProfile", "Listing"];
const NEED = `area IS NOT NULL AND area <> '' AND latitude IS NULL`;

// Collect distinct area+city pairs needing a lookup.
const pairs = new Map();
for (const t of TABLES) {
  const r = await c.execute(`SELECT DISTINCT area, city FROM "${t}" WHERE ${NEED}`);
  for (const row of r.rows) pairs.set(`${row.area}|${row.city}`, { area: row.area, city: row.city });
}
console.log(`Geocoding ${pairs.size} unique area+city pairs...`);

const cache = new Map();
for (const [key, { area, city }] of pairs) {
  const coords = await geocode(area, city);
  cache.set(key, coords);
  console.log(coords ? `✓ ${area}, ${city} → ${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}` : `✗ ${area}, ${city} (no result)`);
  await sleep(1100); // Nominatim: max 1 req/sec
}

let updated = 0;
for (const t of TABLES) {
  const r = await c.execute(`SELECT id, area, city FROM "${t}" WHERE ${NEED}`);
  for (const row of r.rows) {
    const coords = cache.get(`${row.area}|${row.city}`);
    if (!coords) continue;
    await c.execute({
      sql: `UPDATE "${t}" SET latitude = ?, longitude = ? WHERE id = ?`,
      args: [coords.lat, coords.lng, row.id],
    });
    updated++;
  }
}
console.log(`Updated ${updated} rows.`);
