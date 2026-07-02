import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, initials, parsePhotos } from "@/lib/format";
import { LocationMap } from "@/components/map/location-map";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";

type Params = Promise<{ id: string }>;

// Cached so generateMetadata and the page share a single query per request.
const getProvider = cache((id: string) =>
  prisma.providerProfile.findUnique({
    where: { id },
    include: {
      user: true,
      listings: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        include: { category: true, reviews: { select: { rating: true } } },
      },
    },
  }),
);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProvider(id);
  if (!profile) return {};
  const title = `${profile.user.name} — ${profile.city}`;
  const description =
    profile.bio ?? `Услуги от ${profile.user.name} в ${profile.city}. Вижте оферти, оценки и отзиви.`;
  return {
    title,
    description,
    alternates: { canonical: `/providers/${id}` },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/providers/${id}`,
      images: profile.avatarUrl ? [profile.avatarUrl] : undefined,
    },
  };
}

export default async function ProviderProfilePage({ params }: { params: Params }) {
  const { id } = await params;

  const profile = await getProvider(id);
  if (!profile) notFound();

  const allRatings = profile.listings.flatMap((l) => l.reviews.map((r) => r.rating));
  const overall = allRatings.length
    ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
    : null;

  const cards: ListingCardData[] = profile.listings.map((l) => ({
    id: l.id,
    title: l.title,
    city: l.city,
    area: l.area,
    priceLabel: formatPrice(l.priceType, l.price),
    categoryName: l.category.name,
    categoryIcon: l.category.icon,
    providerName: profile.user.name,
    rating: averageRating(l.reviews),
    reviewCount: l.reviews.length,
    imageUrl: parsePhotos(l.photos)[0] ?? null,
  }));

  const providerLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: profile.user.name,
    url: `${SITE_URL}/providers/${profile.id}`,
    areaServed: profile.city,
    ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
    ...(overall != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: overall.toFixed(1),
            reviewCount: allRatings.length,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={providerLd} />
      <Link href="/services" className="text-sm text-black/50 hover:text-cobble-600 dark:text-white/50">
        ← Обратно към услугите
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start gap-4 rounded-2xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        {profile.avatarUrl ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-cobble-100">
            <Image src={profile.avatarUrl} alt={profile.user.name} fill sizes="64px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cobble-100 text-xl font-semibold text-cobble-700 dark:bg-cobble-900/50 dark:text-cobble-300">
            {initials(profile.user.name)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">{profile.user.name}</h1>
            {profile.verified && (
              <span className="rounded-full bg-cobble-50 px-2.5 py-1 text-xs font-medium text-cobble-700 dark:bg-cobble-950/40 dark:text-cobble-300">
                ✓ Проверен
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            {profile.area ? `${profile.area}, ` : ""}
            {profile.city}
            {overall != null && <> · ★ {overall.toFixed(1)} ({allRatings.length})</>}
          </p>
          {profile.bio && <p className="mt-3 text-black/70 dark:text-white/70">{profile.bio}</p>}
          <LocationMap city={profile.city} area={profile.area} className="mt-4 max-w-md" />
        </div>
      </div>

      {/* Listings */}
      <h2 className="mt-10 text-lg font-semibold">
        Услуги от {profile.user.name.split(" ")[0]}
      </h2>
      {cards.length === 0 ? (
        <p className="mt-2 text-black/50 dark:text-white/50">Все още няма активни обяви.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      )}
    </div>
  );
}
