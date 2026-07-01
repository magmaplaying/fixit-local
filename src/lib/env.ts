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
  // Optional: enables Stripe payments. Without these the booking loop works
  // unpaid (no payout onboarding, no checkout).
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  // Platform commission in basis points (1500 = 15%).
  PLATFORM_COMMISSION_BPS: z.coerce.number().int().min(0).max(10000).default(1500),
  // Optional: enables transactional email via Resend. Without it, emails are
  // logged to the server instead of sent (the app works fully either way).
  RESEND_API_KEY: z.string().optional(),
  // Sender identity for outgoing email. Resend's onboarding@resend.dev works for
  // testing; swap for a verified domain (no-reply@podruka.bg) in production.
  EMAIL_FROM: z.string().min(1).default("Podruka <onboarding@resend.dev>"),
});

const parsed = schema.safeParse({
  AUTH_SECRET: process.env.AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  PLATFORM_COMMISSION_BPS: process.env.PLATFORM_COMMISSION_BPS,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
