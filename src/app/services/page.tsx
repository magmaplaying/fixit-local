import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, parsePhotos } from "@/lib/format";

type SearchParams = Promise<{ q?: string; category?: string; city?: string }>;

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

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

  const cards: ListingCardData[] = listings.map((l) => ({
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
  }));

  const activeCategory = sp.category;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Browse services</h1>
      <p className="mt-1 text-black/55 dark:text-white/55">
        {cards.length} {cards.length === 1 ? "result" : "results"}
        {sp.q ? ` for “${sp.q}”` : ""} in {sp.city ?? "Sofia"}
      </p>

      {/* Search */}
      <form action="/services" className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        <input
          name="q"
          type="text"
          defaultValue={sp.q ?? ""}
          placeholder="What do you need done?"
          className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-cobble-500 focus:ring-2 focus:ring-cobble-500/20 dark:border-white/15 dark:bg-white/5"
        />
        <button type="submit" className="rounded-xl bg-cobble-600 px-6 py-2.5 font-medium text-white transition hover:bg-cobble-700">
          Search
        </button>
      </form>

      {/* Category filter chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip href={buildHref(sp.q, undefined)} active={!activeCategory}>
          All
        </FilterChip>
        {categories.map((c) => (
          <FilterChip key={c.id} href={buildHref(sp.q, c.slug)} active={activeCategory === c.slug}>
            <span aria-hidden>{c.icon}</span> {c.name}
          </FilterChip>
        ))}
      </div>

      {/* Results */}
      <div className="mt-8">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 p-12 text-center text-black/50 dark:border-white/15 dark:text-white/50">
            <p className="text-lg font-medium">No services match your search.</p>
            <p className="mt-1 text-sm">Try a different category or clear your filters.</p>
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

function buildHref(q: string | undefined, category: string | undefined): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
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
