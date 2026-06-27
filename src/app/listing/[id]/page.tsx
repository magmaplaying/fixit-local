import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, averageRating, initials } from "@/lib/format";
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/services" className="text-sm text-black/50 hover:text-teal-600 dark:text-white/50">
        ← Back to browse
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Main */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
            <span aria-hidden>{listing.category.icon}</span>
            {listing.category.name}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{listing.title}</h1>
          <p className="mt-2 text-black/55 dark:text-white/55">
            {listing.area ? `${listing.area}, ` : ""}
            {listing.city}
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
              {initials(listing.provider.user.name)}
            </div>
            <div>
              <p className="font-medium">{listing.provider.user.name}</p>
              <p className="text-sm text-black/50 dark:text-white/50">
                {listing.provider.verified ? "✓ Verified provider" : "Provider"}
                {listing.provider.bio ? ` · ${listing.provider.bio}` : ""}
              </p>
            </div>
          </div>

          <h2 className="mt-8 text-lg font-semibold">About this service</h2>
          <p className="mt-2 whitespace-pre-line text-black/70 dark:text-white/70">{listing.description}</p>

          {/* Reviews */}
          <h2 className="mt-8 text-lg font-semibold">
            Reviews{" "}
            {rating != null && (
              <span className="ml-1 text-sm font-normal text-black/50 dark:text-white/50">
                ★ {rating.toFixed(1)} · {listing.reviews.length}
              </span>
            )}
          </h2>
          {listing.reviews.length === 0 ? (
            <p className="mt-2 text-black/50 dark:text-white/50">No reviews yet — be the first after your booking.</p>
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
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
              {formatPrice(listing.priceType, listing.price)}
            </p>

            {isOwner ? (
              <p className="mt-4 rounded-lg bg-black/[0.03] px-3 py-2 text-sm text-black/60 dark:bg-white/5 dark:text-white/60">
                This is your listing. Manage requests from your{" "}
                <Link href="/dashboard" className="font-medium text-teal-600 hover:underline">
                  dashboard
                </Link>
                .
              </p>
            ) : user ? (
              <form action={requestBooking} className="mt-4 space-y-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">When do you need it?</span>
                  <input
                    type="date"
                    name="scheduledFor"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 dark:border-white/15 dark:bg-white/5"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Message (optional)</span>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Describe what you need…"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 dark:border-white/15 dark:bg-white/5"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white transition hover:bg-teal-700"
                >
                  Request booking
                </button>
                <p className="text-center text-xs text-black/45 dark:text-white/45">
                  No payment now — the provider confirms first.
                </p>
              </form>
            ) : (
              <Link
                href={`/login?next=/listing/${listing.id}`}
                className="mt-4 block rounded-lg bg-teal-600 px-4 py-2.5 text-center font-medium text-white transition hover:bg-teal-700"
              >
                Sign in to book
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
