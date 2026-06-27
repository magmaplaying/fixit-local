import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid grid-cols-2 gap-[2px]" aria-hidden>
            <span className="h-2 w-2 rounded-[2px] bg-cobble-500"></span>
            <span className="h-2 w-2 rounded-[2px] bg-cobble-500"></span>
            <span className="h-2 w-2 rounded-[2px] bg-cobble-500"></span>
            <span className="h-2 w-2 rounded-[2px] bg-cobble-700"></span>
          </span>
          <span className="font-display text-lg font-bold tracking-tight">FixIt Local</span>
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/services" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.05]">
            Browse
          </Link>

          {user ? (
            <>
              {user.role === "PROVIDER" && (
                <Link href="/dashboard" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.05]">
                  Dashboard
                </Link>
              )}
              <Link href="/bookings" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.05]">
                My bookings
              </Link>
              <span className="hidden text-black/45 sm:inline">Hi, {user.name.split(" ")[0]}</span>
              <form action={logoutAction}>
                <button className="rounded-lg px-3 py-1.5 text-black/70 hover:bg-black/[0.05]">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.05]">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-cobble-600 px-3.5 py-1.5 font-medium text-white transition hover:bg-cobble-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
