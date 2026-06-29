import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.AUTH_SECRET);

// Prefixes that a CUSTOMER must not reach (provider/admin-only areas).
const PROVIDER_ONLY = ["/dashboard", "/onboarding"];

function isProviderOnly(pathname: string): boolean {
  return PROVIDER_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      // Role-aware gating: a logged-in CUSTOMER can't reach provider areas.
      if (isProviderOnly(pathname) && payload.role === "CUSTOMER") {
        const url = req.nextUrl.clone();
        url.pathname = "/bookings";
        url.searchParams.set("denied", "provider-only");
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    } catch {
      // invalid/expired token → fall through to login redirect
    }
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/bookings/:path*", "/onboarding/:path*", "/chat/:path*"],
};
