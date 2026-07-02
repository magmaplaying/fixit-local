import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, parsePhotos } from "@/lib/format";
import { cityFromSlug } from "@/lib/cities";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";

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
      heading: `Услуги в ${city}`,
      intro: `Намерете доверени майстори в ${city} — почистване, ремонти, уроци, преместване и още. Реални оценки и отзиви, заявка с няколко клика.`,
      metaTitle: `Услуги в ${city}`,
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

  const listings = await prisma.listing.findMany({
    where: r.where,
    orderBy: { createdAt: "desc" },
    include: { category: true, provider: { include: { user: true } }, reviews: { select: { rating: true } } },
  });

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

      <nav aria-label="Навигация" className="text-sm text-black/45">
        <Link href="/services" className="hover:text-cobble-700">
          Услуги
        </Link>{" "}
        / <span className="text-black/70">{r.heading}</span>
      </nav>

      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{r.heading}</h1>
      <p className="mt-2 max-w-2xl text-black/60">{r.intro}</p>
      <p className="mt-1 text-sm text-black/45">
        {cards.length} {cards.length === 1 ? "оферта" : "оферти"}
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
          {cards.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      )}
    </div>
  );
}
