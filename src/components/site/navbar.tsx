import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-background/80 backdrop-blur dark:border-white/10">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Fix<span className="text-teal-600">It</span> Local
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/services" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/10">
            Browse
          </Link>

          {user ? (
            <>
              {user.role === "PROVIDER" && (
                <Link href="/dashboard" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/10">
                  Dashboard
                </Link>
              )}
              <Link href="/bookings" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/10">
                My bookings
              </Link>
              <span className="hidden text-black/45 sm:inline dark:text-white/45">Hi, {user.name.split(" ")[0]}</span>
              <form action={logoutAction}>
                <button className="rounded-lg px-3 py-1.5 text-black/70 hover:bg-black/[0.04] dark:text-white/70 dark:hover:bg-white/10">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/10">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-teal-600 px-3.5 py-1.5 font-medium text-white transition hover:bg-teal-700"
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
