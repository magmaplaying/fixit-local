import { track as vercelTrack } from "@vercel/analytics/server";

/**
 * Server-side product event (Vercel Analytics). Analytics must never break
 * the action it instruments: failures are logged nowhere and swallowed —
 * outside Vercel (local dev) the call is a no-op that may throw internally.
 */
export async function track(
  event: string,
  props?: Record<string, string | number | boolean | null>,
): Promise<void> {
  try {
    await vercelTrack(event, props);
  } catch {
    // deliberately ignored
  }
}
