import Link from "next/link";
import { citySlug } from "@/lib/cities";

// Curated internal links to the category/city landing pages — helps crawlers
// discover them and spreads link equity. Slugs are stable seed data, so they're
// listed statically to avoid a DB query on every page render.
const FOOTER_CATEGORIES: { slug: string; label: string }[] = [
  { slug: "cleaning", label: "Почистване" },
  { slug: "handyman", label: "Майстор за дома" },
  { slug: "tutoring", label: "Уроци" },
  { slug: "plumbing", label: "Водопроводчик" },
  { slug: "electrical", label: "Електротехник" },
  { slug: "moving", label: "Преместване" },
];

const FOOTER_CITIES = ["София", "Пловдив", "Варна", "Бургас", "Русе"];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5 bg-white/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg">
            Под <span className="text-cobble-600">ръка</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-black/55">Доверена местна помощ в цяла България.</p>
        </div>

        <nav aria-label="Услуги">
          <p className="font-mono text-xs uppercase tracking-wider text-black/40">Услуги</p>
          <ul className="mt-3 space-y-2 text-sm text-black/60">
            {FOOTER_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/services/${c.slug}`} className="hover:text-cobble-700">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Градове">
          <p className="font-mono text-xs uppercase tracking-wider text-black/40">Градове</p>
          <ul className="mt-3 space-y-2 text-sm text-black/60">
            {FOOTER_CITIES.map((c) => (
              <li key={c}>
                <Link href={`/services/${citySlug(c)}`} className="hover:text-cobble-700">
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Информация">
          <p className="font-mono text-xs uppercase tracking-wider text-black/40">Информация</p>
          <ul className="mt-3 space-y-2 text-sm text-black/60">
            <li>
              <Link href="/services" className="hover:text-cobble-700">
                Всички услуги
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-cobble-700">
                Поверителност
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-cobble-700">
                Условия
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-black/5">
        <p className="mx-auto max-w-6xl px-4 py-5 font-mono text-xs text-black/45">
          © {new Date().getFullYear()} Под ръка
        </p>
      </div>
    </footer>
  );
}
