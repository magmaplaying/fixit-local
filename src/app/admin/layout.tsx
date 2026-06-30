import Link from "next/link";
import { requireRole } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Преглед" },
  { href: "/admin/users", label: "Потребители" },
  { href: "/admin/providers", label: "Специалисти" },
  { href: "/admin/listings", label: "Обяви" },
  { href: "/admin/reviews", label: "Отзиви" },
  { href: "/admin/reports", label: "Сигнали" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN"); // defense in depth (proxy also gates /admin)
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">Администрация</h1>
      <nav className="mt-4 flex flex-wrap gap-1 border-b border-black/10 pb-3 dark:border-white/10">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-black/60 transition hover:bg-black/[0.04] hover:text-cobble-700 dark:text-white/60 dark:hover:bg-white/5"
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
