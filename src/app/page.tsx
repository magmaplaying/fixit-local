import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, parsePhotos } from "@/lib/format";
import { CITIES } from "@/lib/cities";

const STEPS = [
  { title: "Намерете майстор", body: "Разгледайте проверени специалисти по категория и град — с реални оценки и отзиви." },
  { title: "Заявете услуга", body: "Изпратете заявка с няколко клика. Без предплащане — специалистът първо потвърждава." },
  { title: "Готово", body: "Майсторът идва, свършва работата, а вие оставяте отзив. Просто и спокойно." },
];

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
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80&auto=format&fit=crop"
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full object-cover [filter:sepia(0.5)_saturate(1.3)_brightness(0.66)]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso via-espresso/75 to-espresso/45" />
        <div className="mx-auto max-w-6xl px-4 py-28 sm:py-40">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cobble-300">
            Майстори · Услуги · Цяла България
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.04] font-semibold text-background sm:text-7xl">
            Доверена помощ,
            <br />
            <span className="text-cobble-400">където и да сте.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-background/75">
            Проверени майстори за почистване, ремонти, уроци, преместване и още — във вашия град, в цяла България.
          </p>

          <form
            action="/services"
            className="mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl bg-background p-2 shadow-2xl sm:flex-row"
          >
            <input
              name="q"
              type="text"
              placeholder="Какво трябва да се свърши?"
              className="flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-black/40"
            />
            <select
              name="city"
              className="rounded-xl bg-black/[0.04] px-3 py-3 text-sm outline-none"
              defaultValue=""
            >
              <option value="">Цяла България</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-cobble-600 px-6 py-3 font-medium text-white transition hover:bg-cobble-700"
            >
              Търси
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Разгледай по категория</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/services?category=${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-6 text-center transition hover:-translate-y-0.5 hover:border-cobble-500/40 hover:shadow-lg"
            >
              <span className="text-3xl" aria-hidden>
                {c.icon}
              </span>
              <span className="font-medium">{c.name}</span>
              <span className="font-mono text-[11px] text-black/40">{c._count.listings} майстори</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works (dark editorial) */}
      <section className="bg-espresso text-background">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cobble-400">Как работи</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight font-semibold sm:text-5xl">
            Намерете. Заявете. Готово.
          </h2>
          <div className="mt-14 grid gap-12 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="font-display text-5xl text-cobble-400/50">0{i + 1}</div>
                <h3 className="mt-4 font-display text-xl">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-background/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Препоръчани услуги</h2>
          <Link href="/services" className="text-sm font-medium text-cobble-700 hover:underline">
            Виж всички →
          </Link>
        </div>
        {cards.length === 0 ? (
          <p className="text-black/50">Все още няма обяви. Очаквайте скоро.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
