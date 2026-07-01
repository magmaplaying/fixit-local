import { createClient } from "@libsql/client";

const c = createClient({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const cols = await c.execute("PRAGMA table_info('Booking')");
console.log("Booking columns:", cols.rows.map((r) => r.name).join(", "));
const tables = await c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log("tables:", tables.rows.map((r) => r.name).join(", "));
