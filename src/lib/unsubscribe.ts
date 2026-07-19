import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

// Signed, self-contained unsubscribe tokens for marketing/lifecycle email. Reuses
// AUTH_SECRET (HS256, same as the session layer) so no extra secret or DB table is
// needed — the token itself carries the user id and is verifiable offline.
const secret = new TextEncoder().encode(env.AUTH_SECRET);
const PURPOSE = "unsub";

/** Long-lived token that lets a recipient opt out from an email link. */
export async function signUnsubscribeToken(userId: string): Promise<string> {
  return new SignJWT({ purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret);
}

/** Returns the user id for a valid unsubscribe token, or null if invalid/expired. */
export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== PURPOSE || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}
