import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, parsePhotos } from "@/lib/format";
import { cityFromSlug, citySlug, inCity } from "@/lib/cities";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";
import { PaveDivider } from "@/components/site/pave-divider";

// The cities cross-linked from every landing page (they match the footer's).
const MAIN_CITIES = ["София", "Пловдив", "Варна", "Бургас", "Русе"];

type Params = Promise<{ slug: string }>;

type Resolved = {
  kind: "category" | "city";
  heading: string;
  intro: string;
  metaTitle: string;
  where: Prisma.ListingWhereInput;
};

// A slug is either a category slug (e.g. "cleaning") or a city slug ("sofia").
// The two sets never collide, so one route serves both landing-page types.
async function resolve(slug: string): Promise<Resolved | null> {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (category) {
    return {
      kind: "category",
      heading: `${category.name} в цяла България`,
      intro: `Разгледайте проверени специалисти за „${category.name}“. Сравнете оферти, оценки и цени и заявете онлайн — бързо и без предплащане.`,
      metaTitle: `${category.name} — оферти и цени`,
      where: { active: true, categoryId: category.id },
    };
  }
  const city = cityFromSlug(slug);
  if (city) {
    return {
      kind: "city",
      heading: `Услуги ${inCity(city)}`,
      intro: `Намерете доверени майстори ${inCity(city)} — почистване, ремонти, уроци, преместване и още. Реални оценки и отзиви, заявка с няколко клика.`,
      metaTitle: `Услуги ${inCity(city)}`,
      where: { active: true, city },
    };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) return {};
  return {
    title: r.metaTitle,
    description: r.intro,
    alternates: { canonical: `/services/${slug}` },
    openGraph: { title: `${r.metaTitle} | ${SITE_NAME}`, description: r.intro, url: `${SITE_URL}/services/${slug}` },
  };
}

export default async function ServicesLandingPage({ params }: { params: Params }) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();

  const [listings, allCategories] = await Promise.all([
    prisma.listing.findMany({
      where: r.where,
      orderBy: { createdAt: "desc" },
      include: { category: true, provider: { include: { user: true } }, reviews: { select: { rating: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } }),
  ]);

  // Cross-links: categories ↔ cities. Doubles as SEO internal linking between
  // the landing pages.
  const related: { label: string; href: string }[] =
    r.kind === "category"
      ? [
          ...MAIN_CITIES.map((c) => ({ label: `Услуги ${inCity(c)}`, href: `/services/${citySlug(c)}` })),
          ...allCategories.filter((c) => c.slug !== slug).slice(0, 6).map((c) => ({ label: c.name, href: `/services/${c.slug}` })),
        ]
      : [
          ...allCategories.slice(0, 8).map((c) => ({ label: c.name, href: `/services/${c.slug}` })),
          ...MAIN_CITIES.filter((c) => citySlug(c) !== slug).map((c) => ({ label: `Услуги ${inCity(c)}`, href: `/services/${citySlug(c)}` })),
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

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Услуги", item: `${SITE_URL}/services` },
      { "@type": "ListItem", position: 3, name: r.heading, item: `${SITE_URL}/services/${slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={breadcrumb} />

      <nav aria-label="Навигация" className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-black/40">
        <Link href="/services" className="text-cobble-700 hover:text-cobble-800">
          Каталог
        </Link>{" "}
        <span aria-hidden>·</span> <span>{r.kind === "category" ? "Категория" : "Град"}</span>
      </nav>

      <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{r.heading}</h1>
      <p className="mt-2 max-w-2xl text-black/60">{r.intro}</p>
      <p className="mt-2 text-sm text-black/55">
        <span className="font-semibold text-foreground">{cards.length}</span>{" "}
        {cards.length === 1 ? "оферта" : "оферти"}
      </p>

      {cards.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/10 p-12 text-center">
          <p className="text-lg font-medium">Все още няма оферти тук.</p>
          <Link href="/services" className="mt-3 inline-block text-sm font-medium text-cobble-600 hover:underline">
            Разгледай всички услуги →
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((l, i) => (
            <ListingCard key={l.id} l={l} eager={i < 3} />
          ))}
        </div>
      )}

      {/* Cross-links between the landing pages */}
      <PaveDivider className="mt-16" />
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Разгледайте също</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {related.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm text-black/70 transition hover:border-cobble-500/50 hover:text-cobble-800"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
