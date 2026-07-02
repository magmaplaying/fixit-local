import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, parsePhotos } from "@/lib/format";
import { CITIES } from "@/lib/cities";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/motion/reveal";
import { Counter } from "@/components/motion/counter";
import { HeroParallax } from "@/components/motion/hero-parallax";
import { PaveDivider } from "@/components/site/pave-divider";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "bg",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/services?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

const STEPS = [
  { title: "Намерете майстор", body: "Разгледайте проверени специалисти по категория и град — с реални оценки и отзиви." },
  { title: "Заявете услуга", body: "Изпратете заявка с няколко клика. Без предплащане — специалистът първо потвърждава." },
  { title: "Готово", body: "Майсторът идва, свършва работата, а вие оставяте отзив. Просто и спокойно." },
];

// Short blurbs shown on the featured category cards (home page only).
const CATEGORY_BLURBS: Record<string, string> = {
  cleaning: "Основно и поддържащо почистване на дома и офиса.",
  tutoring: "Подготовка за изпити и помощ с домашните.",
  handyman: "Дребни ремонти, монтаж и поправки вкъщи.",
  moving: "Опаковане и внимателно пренасяне без стрес.",
  plumbing: "Течове, монтажи, бойлери и аварийни ремонти.",
  electrical: "Контакти, осветление и електрически табла.",
  painting: "Латекс, шпакловка и чисто боядисване.",
  ac: "Монтаж, профилактика и зареждане на климатици.",
  gardening: "Косене, оформяне и сезонна поддръжка на двора.",
  childcare: "Грижовни и проверени детегледачи.",
  beauty: "Прически, грим и разкрасяване у дома.",
  it: "Компютри, мрежи и настройка на устройства.",
  auto: "Диагностика, смяна на масло и ремонти.",
  locksmith: "Отключване и смяна на ключалки и патрони.",
};

// Background photo per profession (Unsplash, no API key). Categories without an
// entry fall back to a solid dark card.
const IMG = "?w=800&q=80&auto=format&fit=crop";
const CATEGORY_IMAGES: Record<string, string> = {
  cleaning: `https://images.unsplash.com/photo-1740657254989-42fe9c3b8cce${IMG}`,
  it: `https://images.unsplash.com/photo-1515378791036-0648a3ef77b2${IMG}`,
  painting: `https://images.unsplash.com/photo-1554995207-c18c203602cb${IMG}`,
  plumbing: `https://images.unsplash.com/photo-1749532125405-70950966b0e5${IMG}`,
  gardening: `https://images.unsplash.com/photo-1585320806297-9794b3e4eeae${IMG}`,
  electrical: `https://images.unsplash.com/photo-1682345262055-8f95f3c513ea${IMG}`,
};

export default async function Home() {
  const [categories, listings, providerCount, reviewCount, cityRows] = await Promise.all([
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
    prisma.providerProfile.count(),
    prisma.review.count({ where: { hidden: false } }),
    prisma.listing.findMany({ where: { active: true }, distinct: ["city"], select: { city: true } }),
  ]);

  const stats = [
    { value: providerCount, label: "майстори" },
    { value: categories.length, label: "категории услуги" },
    { value: cityRows.length, label: "града" },
    { value: reviewCount, label: "отзива от клиенти" },
  ];

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

  // Feature a handful of categories on the home page (most providers first);
  // the full list stays in the search dropdown and on /services.
  const featuredCategories = [...categories]
    .sort((a, b) => b._count.listings - a._count.listings)
    .slice(0, 6);

  return (
    <div>
      <JsonLd data={ORGANIZATION_LD} />
      <JsonLd data={WEBSITE_LD} />
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        {/* Backdrop drifts slower than the page — depth without a library. */}
        <HeroParallax className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80&auto=format&fit=crop"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover [filter:sepia(0.5)_saturate(1.3)_brightness(0.66)]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/75 to-espresso/45" />
        </HeroParallax>
        <div className="mx-auto max-w-6xl px-4 py-28 sm:py-40">
          <p className="hero-i1 font-mono text-xs uppercase tracking-[0.22em] text-cobble-300">
            Майстори · Услуги · Цяла България
          </p>
          <h1 className="hero-i2 mt-5 max-w-3xl font-display text-5xl leading-[1.04] font-semibold text-background sm:text-7xl">
            Доверена помощ,
            <br />
            <span className="text-cobble-400">където и да сте.</span>
          </h1>
          <p className="hero-i3 mt-6 max-w-xl text-lg text-background/75">
            Проверени майстори за почистване, ремонти, уроци, преместване и още — във вашия град, в цяла България.
          </p>

          <form
            action="/services"
            className="hero-i4 mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl bg-background p-2 shadow-2xl sm:flex-row"
          >
            <input
              name="q"
              type="text"
              placeholder="Какво трябва да се свърши?"
              className="flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-black/40"
            />
            <select
              name="category"
              defaultValue=""
              className="rounded-xl bg-black/[0.04] px-3 py-3 text-sm outline-none"
            >
              <option value="">Всички категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
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

        {/* Scroll cue */}
        <div aria-hidden className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 sm:block">
          <span className="scroll-cue inline-block text-background/70">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </div>
      </section>

      {/* Categories — featured cards with blurbs (subset; full list on /services) */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <PaveDivider className="mb-12" />
        <Reveal className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cobble-600">Популярни</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Разгледай по категория</h2>
          </div>
          <Link
            href="/services"
            className="hidden shrink-0 font-mono text-xs uppercase tracking-wider text-black/45 transition hover:text-cobble-700 sm:block"
          >
            Всички услуги →
          </Link>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCategories.map((c, i) => {
            const n = c._count.listings;
            const label = n === 0 ? "Очаквайте скоро" : `${n} ${n === 1 ? "майстор" : "майстори"}`;
            const blurb = CATEGORY_BLURBS[c.slug];
            const img = CATEGORY_IMAGES[c.slug];
            return (
              <Reveal key={c.id} delay={i * 70} className="h-full">
              <Link
                href={`/services/${c.slug}`}
                className="group relative isolate flex h-full min-h-[15rem] flex-col justify-end overflow-hidden rounded-2xl bg-espresso text-background outline-none transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-22px_rgba(28,26,23,0.6)] focus-visible:ring-2 focus-visible:ring-cobble-400/70"
              >
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
                <div
                  className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso via-espresso/75 to-espresso/25"
                  aria-hidden
                />
                <div className="p-5">
                  <h3 className="text-xl font-semibold tracking-tight">{c.name}</h3>
                  {blurb && <p className="mt-1.5 text-sm leading-relaxed text-background/80">{blurb}</p>}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/15 pt-3">
                    <span className="text-[13px] font-medium text-background/85">{label}</span>
                    <span className="font-mono text-xs tracking-wide text-background/70 transition-all group-hover:translate-x-0.5 group-hover:text-cobble-300">
                      Виж →
                    </span>
                  </div>
                </div>
              </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* How it works (dark editorial) */}
      <section className="bg-espresso text-background">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cobble-400">Как работи</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight font-semibold sm:text-5xl">
              Намерете. Заявете. Готово.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-12 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 130}>
                <div className="font-display text-5xl text-cobble-400/50">0{i + 1}</div>
                <h3 className="mt-4 font-display text-xl">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-background/65">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Community in numbers — live counts, counted up on scroll */}
      <section aria-label="Платформата в числа" className="border-b border-black/5 bg-white/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 sm:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="text-center">
              <p className="font-display text-4xl font-bold text-cobble-700 sm:text-5xl">
                <Counter value={s.value} />
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-black/45">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Препоръчани услуги</h2>
          <Link href="/services" className="text-sm font-medium text-cobble-700 hover:underline">
            Виж всички →
          </Link>
        </Reveal>
        {cards.length === 0 ? (
          <p className="text-black/50">Все още няма обяви. Очаквайте скоро.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((l, i) => (
              <Reveal key={l.id} delay={(i % 3) * 80} className="h-full">
                <ListingCard l={l} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
