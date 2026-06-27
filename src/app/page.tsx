import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, parsePhotos } from "@/lib/format";

export default async function Home() {
  const [categories, listings] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { listings: true } } },
    }),
    prisma.listing.findMany({
      where: { active: true },
      take: 6,
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

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-black/5 bg-gradient-to-b from-teal-50/70 to-transparent dark:border-white/10 dark:from-teal-950/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Trusted local help, <span className="text-teal-600">a few taps away.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-black/60 dark:text-white/60">
            Book vetted cleaners, handymen, tutors, movers and more across Sofia. Real people, real reviews.
          </p>

          <form action="/services" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <input
              name="q"
              type="text"
              placeholder="What do you need done?"
              className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-white/15 dark:bg-white/5"
            />
            <select
              name="city"
              defaultValue="Sofia"
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-white/15 dark:bg-white/5"
            >
              <option value="Sofia">Sofia</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-6 py-3 font-medium text-white transition hover:bg-teal-700"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold">Browse by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/services?category=${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-black/5 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-md dark:border-white/10 dark:bg-white/5"
            >
              <span className="text-3xl" aria-hidden>
                {c.icon}
              </span>
              <span className="text-sm font-medium">{c.name}</span>
              <span className="text-xs text-black/40 dark:text-white/40">{c._count.listings} pros</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured services</h2>
          <Link href="/services" className="text-sm font-medium text-teal-600 hover:underline">
            See all →
          </Link>
        </div>
        {cards.length === 0 ? (
          <p className="text-black/50 dark:text-white/50">No listings yet. Check back soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
