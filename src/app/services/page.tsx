import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, parsePhotos } from "@/lib/format";
import { CITIES } from "@/lib/cities";
import { cityCoords, haversineKm, nearestCity, parseLatLng } from "@/lib/geo";
import { NearMeButton } from "@/components/search/near-me-button";
import { CardScroller } from "@/components/listing/card-scroller";
import { Reveal } from "@/components/motion/reveal";
import { Counter } from "@/components/motion/counter";
import { PaveDivider } from "@/components/site/pave-divider";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  city?: string;
  near?: string;
  radius?: string;
}>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const title = sp.q ? `Търсене: ${sp.q}` : sp.city ? `Услуги в ${sp.city}` : "Всички услуги";
  return {
    title,
    description:
      "Разгледайте и заявете проверени майстори в цяла България — филтрирайте по категория, град и близост до вас.",
    // Query-param variants all canonicalise to the clean browse page.
    alternates: { canonical: "/services" },
  };
}

const RADII = [5, 10, 25, 50] as const;

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const near = parseLatLng(sp.near);
  const radius = sp.radius && near ? Number(sp.radius) : null;

  const [categories, listings, topPool] = await Promise.all([
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
    // Pool for the "Препоръчани майстори" scroller — cross-catalog (ignores the
    // active filters), so it doubles as a recovery path on thin/empty results.
    prisma.listing.findMany({
      where: { active: true },
      take: 24,
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

  // Featured listings (paid boost, not expired) float to the top (stable sort
  // preserves the createdAt/distance order within each group).
  const isFeatured = (l: { featuredUntil: Date | null }) =>
    l.featuredUntil != null && l.featuredUntil > new Date();
  items.sort((a, b) => Number(isFeatured(b.l)) - Number(isFeatured(a.l)));

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
    featured: isFeatured(l),
  }));

  // Scroller content: top-rated first (by rating, then review count), newest
  // profiles as fill — capped at 8 slides.
  const topCards: ListingCardData[] = topPool
    .map((l) => ({ l, rating: averageRating(l.reviews) }))
    .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.l.reviews.length - a.l.reviews.length)
    .slice(0, 8)
    .map(({ l, rating }) => ({
      id: l.id,
      title: l.title,
      city: l.city,
      area: l.area,
      priceLabel: formatPrice(l.priceType, l.price),
      categoryName: l.category.name,
      categoryIcon: l.category.icon,
      providerName: l.provider.user.name,
      rating,
      reviewCount: l.reviews.length,
      imageUrl: parsePhotos(l.photos)[0] ?? null,
    }));

  const activeCategory = sp.category;
  const nearestName = near ? nearestCity(near) : null;

  // Filters to preserve when the near-me button fires.
  const carryParams: Record<string, string> = {};
  if (sp.q) carryParams.q = sp.q;
  if (sp.category) carryParams.category = sp.category;
  if (sp.city) carryParams.city = sp.city;
  if (sp.radius) carryParams.radius = sp.radius;

  // Swipeable dark strip sandwiched between the result rows.
  const scroller = topCards.length >= 4 && (
    <Reveal className="mt-10">
      <section className="overflow-hidden rounded-3xl bg-espresso p-6 text-background sm:p-8">
        <CardScroller
          label="Препоръчани майстори"
          header={
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-cobble-300">
                Препоръчани майстори
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Топ оценени и нови профили</h2>
            </div>
          }
        >
          {topCards.map((l) => (
            <div key={l.id} className="w-[16.5rem] shrink-0 snap-start">
              <ListingCard l={l} />
            </div>
          ))}
        </CardScroller>
      </section>
    </Reveal>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-cobble-600">
        Каталог · {sp.city || "Цяла България"}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Разгледай услуги</h1>
      <p className="mt-2 text-sm text-black/55 dark:text-white/55">
        <span className="font-semibold text-foreground">
          <Counter value={cards.length} duration={600} />
        </span>{" "}
        {cards.length === 1 ? "резултат" : "резултата"}
        {sp.q ? ` за „${sp.q}“` : ""}
        {near ? " · подредени по близост до вас" : ""}
      </p>

      {/* Search — one white bar, same language as the home hero */}
      <form
        action="/services"
        className="mt-6 flex max-w-3xl flex-col gap-2 rounded-2xl border border-black/5 bg-white p-2 shadow-[0_10px_30px_-18px_rgba(33,26,19,0.25)] sm:flex-row"
      >
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        {sp.near && <input type="hidden" name="near" value={sp.near} />}
        {sp.radius && <input type="hidden" name="radius" value={sp.radius} />}
        <input
          name="q"
          type="text"
          defaultValue={sp.q ?? ""}
          placeholder="Какво трябва да се свърши?"
          aria-label="Търсене на услуга"
          className="flex-1 rounded-xl bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-black/40 focus:bg-black/[0.03]"
        />
        <select
          name="city"
          defaultValue={sp.city ?? ""}
          aria-label="Град"
          className="rounded-xl bg-black/[0.04] px-3 py-2.5 text-sm outline-none transition hover:bg-black/[0.07]"
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

      {/* Category rail — sticks under the navbar so you can re-filter from
          anywhere in the list; scrolls horizontally with faded edges. */}
      <nav
        aria-label="Категории"
        className="sticky top-[4.5rem] z-30 mt-6 rounded-2xl border border-black/5 bg-background/90 p-2 backdrop-blur"
      >
        <div className="chip-rail flex gap-2 overflow-x-auto p-1">
          <FilterChip href={buildUrl(sp, { category: undefined })} active={!activeCategory}>
            Всички
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} href={buildUrl(sp, { category: c.slug })} active={activeCategory === c.slug}>
              <span aria-hidden>{c.icon}</span> {c.name}
            </FilterChip>
          ))}
        </div>
      </nav>

      {/* Results — the scroller strip sits between the first rows and the rest */}
      <div className="mt-8">
        {cards.length === 0 ? (
          <>
            <div className="rounded-2xl border border-dashed border-black/10 p-12 text-center text-black/50 dark:border-white/15 dark:text-white/50">
              <PaveDivider className="mb-6" />
              <p className="text-lg font-medium text-foreground">Няма услуги по тези критерии.</p>
              <p className="mt-1 text-sm">
                {near && radius
                  ? "Опитайте по-голям радиус или изчистете филтрите."
                  : "Опитайте друга категория или изчистете филтрите."}
              </p>
              <Link href="/services" className="mt-4 inline-block text-sm font-medium text-cobble-600 hover:underline">
                Изчисти филтрите →
              </Link>
            </div>
            {/* Recovery path: nothing matched, but these might. */}
            {scroller}
          </>
        ) : (
          <>
            {/* First rows render instantly so re-filtering feels snappy;
                the first row's images load eagerly (they're the page's LCP). */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.slice(0, 6).map((l, i) => (
                <ListingCard key={l.id} l={l} eager={i < 3} />
              ))}
            </div>

            {scroller}

            {/* Deeper rows settle in on scroll like the rest of the site. */}
            {cards.length > 6 && (
              <div className={`${scroller ? "mt-10" : "mt-4"} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
                {cards.slice(6).map((l) => (
                  <Reveal key={l.id} className="h-full">
                    <ListingCard l={l} />
                  </Reveal>
                ))}
              </div>
            )}
          </>
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
          ? "shrink-0 whitespace-nowrap rounded-full bg-cobble-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm"
          : "shrink-0 whitespace-nowrap rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm text-black/70 transition hover:border-cobble-500/50 hover:text-cobble-800 dark:border-white/15 dark:bg-white/5"
      }
    >
      {children}
    </Link>
  );
}
