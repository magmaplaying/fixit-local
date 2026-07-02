import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-black/50 sm:flex-row">
        <p className="font-display text-base">
          Под <span className="text-cobble-600">ръка</span> — доверена местна помощ в цяла България.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/services" className="hover:text-cobble-700">
            Услуги
          </Link>
          <Link href="/privacy" className="hover:text-cobble-700">
            Поверителност
          </Link>
          <Link href="/terms" className="hover:text-cobble-700">
            Условия
          </Link>
        </nav>
        <p className="font-mono text-xs">© {new Date().getFullYear()} Под ръка</p>
      </div>
    </footer>
  );
}
