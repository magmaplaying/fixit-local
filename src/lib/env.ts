import { z } from "zod";

// Fail-fast environment validation. Imported at module load by auth/proxy/db so
// a misconfigured deploy crashes loudly instead of silently falling back to an
// insecure default (a missing AUTH_SECRET in prod = forgeable sessions).
const isProd = process.env.NODE_ENV === "production";
// A hosted Turso DB (libsql://) needs an auth token; a local file: DB never
// does — so gate the token requirement on the DB type, not NODE_ENV (otherwise
// a local production build against dev.db would falsely demand a token).
const usesTurso = (process.env.DATABASE_URL ?? "").startsWith("libsql://");

// Dev-only convenience default. NEVER used in production.
const DEV_SECRET = "dev-insecure-secret-change-me";

const schema = z.object({
  // In prod AUTH_SECRET must be a real, sufficiently long secret. In dev we
  // allow a fixed insecure default so the app boots without setup.
  AUTH_SECRET: isProd
    ? z.string().min(16, "AUTH_SECRET must be set (≥16 chars) in production")
    : z.string().min(1).default(DEV_SECRET),
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  TURSO_AUTH_TOKEN: usesTurso
    ? z.string().min(1, "TURSO_AUTH_TOKEN is required for a hosted Turso (libsql://) database")
    : z.string().optional(),
  // Optional: enables real image upload via Vercel Blob. Without it the app
  // still runs and providers can paste image URLs instead.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse({
  AUTH_SECRET: process.env.AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
