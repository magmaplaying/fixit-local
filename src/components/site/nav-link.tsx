"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navbar link that highlights when its section is the current one — the
 * "you are here" cue most catalogs skip (Baymard: 95% of sites don't mark
 * the current scope in the main nav).
 */
export function NavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 transition hover:bg-black/[0.05] ${
        active ? "bg-cobble-50 font-medium text-cobble-800" : ""
      } ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
