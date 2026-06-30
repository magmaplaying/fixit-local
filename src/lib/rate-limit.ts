// Tiny in-memory per-key rate limiter (best-effort; resets on cold start and is
// per-instance). Adequate to blunt spam at MVP scale; swap for a store-backed
// limiter (e.g. Turso/Upstash) when traffic grows.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Returns true if the action is allowed, false if the key is over `limit` in `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
