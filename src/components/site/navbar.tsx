import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { getUnreadCounts } from "@/lib/unread";
import { getUnreadNotificationCount } from "@/lib/notify";
import { NavScrollFx } from "@/components/motion/nav-scroll-fx";
import { Logo } from "@/components/site/logo";
import { NavLink } from "@/components/site/nav-link";

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
      {n}
    </span>
  );
}

export async function Navbar() {
  const user = await getCurrentUser();
  const [unread, notifCount] = user
    ? await Promise.all([getUnreadCounts(user.id), getUnreadNotificationCount(user.id)])
    : [null, 0];

  return (
    <header className="site-nav sticky top-0 z-40 border-b border-black/10 bg-background/85 backdrop-blur">
      <NavScrollFx />
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group" aria-label="Под ръка — начало">
          <Logo />
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-3">
          <NavLink href="/services">Услуги</NavLink>

          {user ? (
            <>
              {user.role === "PROVIDER" && (
                <NavLink href="/dashboard" className="inline-flex items-center">
                  Табло
                  <Badge n={unread?.provider ?? 0} />
                </NavLink>
              )}
              <NavLink href="/bookings" className="inline-flex items-center">
                Моите заявки
                <Badge n={unread?.customer ?? 0} />
              </NavLink>
              <Link
                href="/notifications"
                aria-label="Известия"
                className="relative inline-flex items-center rounded-lg px-2.5 py-1.5 hover:bg-black/[0.05]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {notifCount > 0 && (
                  <span className="absolute right-0 top-0 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-4 text-white">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Link>
              <NavLink href="/settings" className="inline-flex items-center gap-1.5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="sr-only">Профил</span>
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </NavLink>
              <form action={logoutAction}>
                <button className="rounded-lg px-3 py-1.5 text-black/70 hover:bg-black/[0.05]">Изход</button>
              </form>
            </>
          ) : (
            <>
              <NavLink href="/login">Вход</NavLink>
              <Link
                href="/register"
                className="btn-press rounded-lg bg-cobble-600 px-3.5 py-1.5 font-medium text-white transition hover:bg-cobble-700"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
