import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { setBookingStatus } from "@/app/_actions/bookings";
import { StatusBadge } from "@/components/booking/status-badge";
import { formatPrice } from "@/lib/format";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: user.id },
    include: {
      listings: {
        orderBy: { createdAt: "desc" },
        include: { category: true, _count: { select: { bookings: true, reviews: true } } },
      },
    },
  });

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Become a provider</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Set up your provider profile to start listing services and receiving bookings.
        </p>
        <Link
          href="/onboarding/provider"
          className="mt-6 inline-block rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white transition hover:bg-teal-700"
        >
          Set up my profile
        </Link>
      </div>
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { listing: { providerId: profile.id } },
    orderBy: { createdAt: "desc" },
    include: { listing: true, customer: true },
  });
  const pending = bookings.filter((b) => b.status === "REQUESTED");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Provider dashboard</h1>
      <p className="mt-1 text-black/55 dark:text-white/55">
        {profile.listings.length} listing{profile.listings.length === 1 ? "" : "s"} · {pending.length} pending request
        {pending.length === 1 ? "" : "s"}
      </p>

      {/* Incoming bookings */}
      <h2 className="mt-8 text-lg font-semibold">Incoming requests</h2>
      {bookings.length === 0 ? (
        <p className="mt-2 text-black/50 dark:text-white/50">No booking requests yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex flex-col gap-3 rounded-xl border border-black/5 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{b.listing.title}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
                  {b.customer.name}
                  {b.scheduledFor ? ` · ${b.scheduledFor.toLocaleDateString()}` : ""}
                  {b.message ? ` · “${b.message}”` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {b.status === "REQUESTED" && (
                  <>
                    <StatusButton bookingId={b.id} status="ACCEPTED" label="Accept" variant="primary" />
                    <StatusButton bookingId={b.id} status="DECLINED" label="Decline" variant="ghost" />
                  </>
                )}
                {b.status === "ACCEPTED" && (
                  <StatusButton bookingId={b.id} status="COMPLETED" label="Mark complete" variant="primary" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Listings */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">My listings</h2>
        <span
          className="cursor-not-allowed rounded-lg border border-dashed border-black/15 px-3 py-1.5 text-sm text-black/40 dark:border-white/15 dark:text-white/40"
          title="Listing creation lands in the next sprint"
        >
          + New listing (soon)
        </span>
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {profile.listings.map((l) => (
          <li key={l.id} className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-black/45 dark:text-white/45">
                {l.category.icon} {l.category.name}
              </span>
              <span className="font-semibold text-teal-700 dark:text-teal-400">
                {formatPrice(l.priceType, l.price)}
              </span>
            </div>
            <Link href={`/listing/${l.id}`} className="mt-1 block font-medium hover:text-teal-600">
              {l.title}
            </Link>
            <p className="mt-1 text-xs text-black/45 dark:text-white/45">
              {l._count.bookings} bookings · {l._count.reviews} reviews
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusButton({
  bookingId,
  status,
  label,
  variant,
}: {
  bookingId: string;
  status: string;
  label: string;
  variant: "primary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-700"
      : "rounded-lg border border-black/10 px-3 py-1.5 text-sm text-black/60 transition hover:border-red-300 hover:text-red-600 dark:border-white/15 dark:text-white/60";
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="status" value={status} />
      <button className={cls}>{label}</button>
    </form>
  );
}
