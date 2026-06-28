import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, parsePhotos } from "@/lib/format";
import { CITIES } from "@/lib/cities";
import { cityCoords, haversineKm, nearestCity, parseLatLng } from "@/lib/geo";
import { NearMeButton } from "@/components/search/near-me-button";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  city?: string;
  near?: string;
  radius?: string;
}>;

const RADII = [5, 10, 25, 50] as const;

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const near = parseLatLng(sp.near);
  const radius = sp.radius && near ? Number(sp.radius) : null;

  const [categories, listings] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.listing.findMany({
      where: {
        active: true,
        ...(sp.city ? { city: sp.city } : {}),
        ...(sp.category ? { category: { slug: sp.category } } : {}),
        ...(sp.q
          ? { OR: [{ title: { contains: sp.q } }, { description: { contains: sp.q } }] }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        provider: { include: { user: true } },
        reviews: { select: { rating: true } },
      },
    }),
  ]);

  // Attach distance (from the listing's city center) when searching near a point.
  let items = listings.map((l) => {
    const coords = cityCoords(l.city);
    const distanceKm = near && coords ? haversineKm(near, coords) : null;
    return { l, distanceKm };
  });
  if (near) {
    if (radius && Number.isFinite(radius)) {
      items = items.filter((it) => it.distanceKm != null && it.distanceKm <= radius);
    }
    items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  const cards: ListingCardData[] = items.map(({ l, distanceKm }) => ({
    id: l.id,
    title: l.title,
    city: l.city,
    area: l.area,
    priceLabel: formatPrice(l.priceType, l.price),
    categoryName: l.category.name,
    categoryIcon: l.category.icon,
    providerName: l.provider.user.name,
    rating: averageRating(l.reviews),
    reviewCount: l.reviews.length,
    imageUrl: parsePhotos(l.photos)[0] ?? null,
    distanceKm,
  }));

  const activeCategory = sp.category;
  const nearestName = near ? nearestCity(near) : null;

  // Filters to preserve when the near-me button fires.
  const carryParams: Record<string, string> = {};
  if (sp.q) carryParams.q = sp.q;
  if (sp.category) carryParams.category = sp.category;
  if (sp.city) carryParams.city = sp.city;
  if (sp.radius) carryParams.radius = sp.radius;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">Разгледай услуги</h1>
      <p className="mt-1 text-black/55 dark:text-white/55">
        {cards.length} {cards.length === 1 ? "резултат" : "резултата"}
        {sp.q ? ` за „${sp.q}“` : ""}
        {near ? " · подредени по близост до вас" : ` в ${sp.city || "България"}`}
      </p>

      {/* Search */}
      <form action="/services" className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row">
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        {sp.near && <input type="hidden" name="near" value={sp.near} />}
        {sp.radius && <input type="hidden" name="radius" value={sp.radius} />}
        <input
          name="q"
          type="text"
          defaultValue={sp.q ?? ""}
          placeholder="Какво трябва да се свърши?"
          className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-cobble-500 focus:ring-2 focus:ring-cobble-500/20 dark:border-white/15 dark:bg-white/5"
        />
        <select
          name="city"
          defaultValue={sp.city ?? ""}
          className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-cobble-500 dark:border-white/15 dark:bg-white/5"
        >
          <option value="">Цяла България</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <NearMeButton params={carryParams} />
        <button type="submit" className="rounded-xl bg-cobble-600 px-6 py-2.5 font-medium text-white transition hover:bg-cobble-700">
          Търси
        </button>
      </form>

      {/* Proximity bar — radius filter + clear, shown only in "near me" mode */}
      {near && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-cobble-500/30 bg-cobble-50/60 px-4 py-3 text-sm dark:border-cobble-500/25 dark:bg-cobble-950/20">
          <span className="font-medium">
            📍 Близо до вас{nearestName ? ` · ${nearestName}` : ""}
          </span>
          <span className="text-black/40 dark:text-white/40">Радиус:</span>
          {RADII.map((r) => (
            <FilterChip key={r} href={buildUrl(sp, { radius: String(r) })} active={radius === r}>
              {r} км
            </FilterChip>
          ))}
          <FilterChip href={buildUrl(sp, { radius: undefined })} active={!radius}>
            Навсякъде
          </FilterChip>
          <Link
            href={buildUrl(sp, { near: undefined, radius: undefined })}
            className="ml-auto text-sm font-medium text-cobble-700 hover:underline dark:text-cobble-400"
          >
            Изчисти близостта
          </Link>
        </div>
      )}

      {/* Category filter chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip href={buildUrl(sp, { category: undefined })} active={!activeCategory}>
          Всички
        </FilterChip>
        {categories.map((c) => (
          <FilterChip key={c.id} href={buildUrl(sp, { category: c.slug })} active={activeCategory === c.slug}>
            <span aria-hidden>{c.icon}</span> {c.name}
          </FilterChip>
        ))}
      </div>

      {/* Results */}
      <div className="mt-8">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 p-12 text-center text-black/50 dark:border-white/15 dark:text-white/50">
            <p className="text-lg font-medium">No services match your search.</p>
            <p className="mt-1 text-sm">
              {near && radius
                ? "Опитайте по-голям радиус или изчистете филтрите."
                : "Опитайте друга категория или изчистете филтрите."}
            </p>
            <Link href="/services" className="mt-4 inline-block text-sm font-medium text-cobble-600 hover:underline">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type UrlParams = { q?: string; category?: string; city?: string; near?: string; radius?: string };

/** Rebuild the /services URL preserving current params, applying overrides. A
 *  key set to `undefined` (or empty) is removed. */
function buildUrl(sp: UrlParams, overrides: Partial<UrlParams>): string {
  const merged: UrlParams = { ...sp, ...overrides };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `/services?${qs}` : "/services";
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-cobble-600 px-3.5 py-1.5 text-sm font-medium text-white"
          : "rounded-full border border-black/10 px-3.5 py-1.5 text-sm transition hover:border-cobble-500/40 dark:border-white/15"
      }
    >
      {children}
    </Link>
  );
}
