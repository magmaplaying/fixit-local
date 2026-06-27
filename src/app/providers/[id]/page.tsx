import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ListingCard, type ListingCardData } from "@/components/listing/listing-card";
import { formatPrice, averageRating, initials, parsePhotos } from "@/lib/format";

type Params = Promise<{ id: string }>;

export default async function ProviderProfilePage({ params }: { params: Params }) {
  const { id } = await params;

  const profile = await prisma.providerProfile.findUnique({
    where: { id },
    include: {
      user: true,
      listings: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        include: { category: true, reviews: { select: { rating: true } } },
      },
    },
  });
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/services" className="text-sm text-black/50 hover:text-teal-600 dark:text-white/50">
        ← Back to browse
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start gap-4 rounded-2xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xl font-semibold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
          {initials(profile.user.name)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{profile.user.name}</h1>
            {profile.verified && (
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            {profile.area ? `${profile.area}, ` : ""}
            {profile.city}
            {overall != null && <> · ★ {overall.toFixed(1)} ({allRatings.length})</>}
          </p>
          {profile.bio && <p className="mt-3 text-black/70 dark:text-white/70">{profile.bio}</p>}
        </div>
      </div>

      {/* Listings */}
      <h2 className="mt-10 text-lg font-semibold">
        Services by {profile.user.name.split(" ")[0]}
      </h2>
      {cards.length === 0 ? (
        <p className="mt-2 text-black/50 dark:text-white/50">No active listings right now.</p>
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
