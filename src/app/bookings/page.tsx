import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { setBookingStatus } from "@/app/_actions/bookings";
import { StatusBadge } from "@/components/booking/status-badge";
import { ReviewForm } from "@/components/booking/review-form";
import { formatPrice } from "@/lib/format";

type SearchParams = Promise<{ requested?: string; reviewed?: string }>;

export default async function BookingsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/bookings");
  const sp = await searchParams;

  const bookings = await prisma.booking.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { include: { category: true, provider: { include: { user: true } } } },
      review: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Моите заявки</h1>

      {sp.requested && (
        <p className="mt-4 rounded-xl bg-cobble-50 px-4 py-3 text-sm text-cobble-800 dark:bg-cobble-950/40 dark:text-cobble-200">
          ✓ Заявката е изпратена! Специалистът ще потвърди скоро.
        </p>
      )}
      {sp.reviewed && (
        <p className="mt-4 rounded-xl bg-cobble-50 px-4 py-3 text-sm text-cobble-800 dark:bg-cobble-950/40 dark:text-cobble-200">
          ✓ Благодарим за отзива!
        </p>
      )}

      {bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/10 p-12 text-center dark:border-white/15">
          <p className="text-lg font-medium">Все още нямате заявки.</p>
          <Link href="/services" className="mt-3 inline-block text-sm font-medium text-cobble-600 hover:underline">
            Разгледай услуги →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/listing/${b.listingId}`} className="font-medium hover:text-cobble-600">
                      {b.listing.title}
                    </Link>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
                    {b.listing.provider.user.name} · {formatPrice(b.listing.priceType, b.listing.price)}
                    {b.scheduledFor ? ` · ${b.scheduledFor.toLocaleDateString()}` : ""}
                  </p>
                </div>
                {(b.status === "REQUESTED" || b.status === "ACCEPTED") && (
                  <form action={setBookingStatus}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <input type="hidden" name="status" value="CANCELLED" />
                    <button className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-black/60 transition hover:border-red-300 hover:text-red-600 dark:border-white/15 dark:text-white/60">
                      Откажи
                    </button>
                  </form>
                )}
              </div>

              {b.status === "COMPLETED" &&
                (b.review ? (
                  <p className="mt-3 border-t border-black/5 pt-3 text-sm dark:border-white/10">
                    <span className="text-amber-500" aria-hidden>
                      {"★".repeat(b.review.rating)}
                      <span className="text-black/15 dark:text-white/15">{"★".repeat(5 - b.review.rating)}</span>
                    </span>{" "}
                    <span className="text-black/60 dark:text-white/60">
                      Вашият отзив{b.review.comment ? `: „${b.review.comment}“` : ""}
                    </span>
                  </p>
                ) : (
                  <ReviewForm bookingId={b.id} />
                ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
