import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, averageRating, initials, parsePhotos } from "@/lib/format";
import { LocationMap } from "@/components/map/location-map";
import { requestBooking } from "@/app/_actions/bookings";

type Params = Promise<{ id: string }>;

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      category: true,
      provider: { include: { user: true } },
      reviews: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!listing || !listing.active) notFound();

  const user = await getCurrentUser();
  const rating = averageRating(listing.reviews);
  const isOwner = user != null && listing.provider.userId === user.id;
  const photos = parsePhotos(listing.photos);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/services" className="text-sm text-black/50 hover:text-cobble-600 dark:text-white/50">
        ← Обратно към услугите
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Main */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cobble-50 px-2.5 py-1 text-xs font-medium text-cobble-700 dark:bg-cobble-950/40 dark:text-cobble-300">
            <span aria-hidden>{listing.category.icon}</span>
            {listing.category.name}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{listing.title}</h1>
          <p className="mt-2 text-black/55 dark:text-white/55">
            {listing.area ? `${listing.area}, ` : ""}
            {listing.city}
          </p>

          {photos.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-cobble-50">
                <Image
                  src={photos[0]}
                  alt={listing.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 700px, 100vw"
                  className="object-cover"
                />
              </div>
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.slice(1).map((p, i) => (
                    <div key={`${p}-${i}`} className="relative aspect-square overflow-hidden rounded-lg bg-cobble-50">
                      <Image
                        src={p}
                        alt={`${listing.title} — снимка ${i + 2}`}
                        fill
                        sizes="180px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cobble-100 font-semibold text-cobble-700 dark:bg-cobble-900/50 dark:text-cobble-300">
              {initials(listing.provider.user.name)}
            </div>
            <div>
              <Link href={`/providers/${listing.provider.id}`} className="font-medium hover:text-cobble-600">
                {listing.provider.user.name}
              </Link>
              <p className="text-sm text-black/50 dark:text-white/50">
                {listing.provider.verified ? "✓ Проверен специалист" : "Специалист"}
                {listing.provider.bio ? ` · ${listing.provider.bio}` : ""}
              </p>
            </div>
          </div>

          <h2 className="mt-8 text-lg font-semibold">За услугата</h2>
          <p className="mt-2 whitespace-pre-line text-black/70 dark:text-white/70">{listing.description}</p>

          <h2 className="mt-8 text-lg font-semibold">Локация</h2>
          <LocationMap city={listing.city} area={listing.area} className="mt-3" />

          {/* Отзиви */}
          <h2 className="mt-8 text-lg font-semibold">
            Отзиви{" "}
            {rating != null && (
              <span className="ml-1 text-sm font-normal text-black/50 dark:text-white/50">
                ★ {rating.toFixed(1)} · {listing.reviews.length}
              </span>
            )}
          </h2>
          {listing.reviews.length === 0 ? (
            <p className="mt-2 text-black/50 dark:text-white/50">Все още няма отзиви — бъдете първият след вашата заявка.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {listing.reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-black/5 p-4 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.author.name}</span>
                    <span className="text-amber-500" aria-hidden>
                      {"★".repeat(r.rating)}
                      <span className="text-black/15 dark:text-white/15">{"★".repeat(5 - r.rating)}</span>
                    </span>
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-black/70 dark:text-white/70">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Booking sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-2xl font-bold text-cobble-700 dark:text-cobble-400">
              {formatPrice(listing.priceType, listing.price)}
            </p>

            {isOwner ? (
              <p className="mt-4 rounded-lg bg-black/[0.03] px-3 py-2 text-sm text-black/60 dark:bg-white/5 dark:text-white/60">
                Това е вашата обява. Управлявайте заявките от вашето{" "}
                <Link href="/dashboard" className="font-medium text-cobble-600 hover:underline">
                  табло
                </Link>
                .
              </p>
            ) : user ? (
              <form action={requestBooking} className="mt-4 space-y-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Кога ви трябва?</span>
                  <input
                    type="date"
                    name="scheduledFor"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-cobble-500 dark:border-white/15 dark:bg-white/5"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Съобщение (по избор)</span>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Опишете какво ви трябва…"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-cobble-500 dark:border-white/15 dark:bg-white/5"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-cobble-600 px-4 py-2.5 font-medium text-white transition hover:bg-cobble-700"
                >
                  Заяви услуга
                </button>
                <p className="text-center text-xs text-black/45 dark:text-white/45">
                  Без плащане сега — специалистът първо потвърждава.
                </p>
              </form>
            ) : (
              <Link
                href={`/login?next=/listing/${listing.id}`}
                className="mt-4 block rounded-lg bg-cobble-600 px-4 py-2.5 text-center font-medium text-white transition hover:bg-cobble-700"
              >
                Влез, за да заявиш
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
