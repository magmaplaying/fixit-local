import { headers } from "next/headers";

/**
 * Absolute base URL (protocol + host) of the current request. Used to build
 * absolute links for Stripe redirects and for links inside emails, which must
 * be absolute. Falls back to localhost when the host header is absent.
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
