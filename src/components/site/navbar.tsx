import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { getUnreadCounts } from "@/lib/unread";
import { getUnreadNotificationCount } from "@/lib/notify";

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
    <header className="sticky top-0 z-40 border-b border-black/10 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          Под <span className="text-cobble-600">ръка</span>
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/services" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.05]">
            Услуги
          </Link>

          {user ? (
            <>
              {user.role === "PROVIDER" && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-lg px-3 py-1.5 hover:bg-black/[0.05]"
                >
                  Табло
                  <Badge n={unread?.provider ?? 0} />
                </Link>
              )}
              <Link
                href="/bookings"
                className="inline-flex items-center rounded-lg px-3 py-1.5 hover:bg-black/[0.05]"
              >
                Моите заявки
                <Badge n={unread?.customer ?? 0} />
              </Link>
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
              <span className="hidden text-black/45 sm:inline">Здравей, {user.name.split(" ")[0]}</span>
              <form action={logoutAction}>
                <button className="rounded-lg px-3 py-1.5 text-black/70 hover:bg-black/[0.05]">Изход</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 hover:bg-black/[0.05]">
                Вход
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-cobble-600 px-3.5 py-1.5 font-medium text-white transition hover:bg-cobble-700"
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
