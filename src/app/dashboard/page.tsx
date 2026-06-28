import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { setBookingStatus } from "@/app/_actions/bookings";
import { deleteListing } from "@/app/_actions/listings";
import { StatusBadge } from "@/components/booking/status-badge";
import { formatPrice } from "@/lib/format";

type SearchParams = Promise<{ created?: string; updated?: string; deleted?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const sp = await searchParams;

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
        <h1 className="text-2xl font-bold tracking-tight">Станете специалист</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Създайте профил на специалист, за да публикувате услуги и да получавате заявки.
        </p>
        <Link
          href="/onboarding/provider"
          className="mt-6 inline-block rounded-lg bg-cobble-600 px-5 py-2.5 font-medium text-white transition hover:bg-cobble-700"
        >
          Създай профил
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
      <h1 className="font-display text-2xl font-bold tracking-tight">Табло на специалиста</h1>
      <p className="mt-1 text-black/55 dark:text-white/55">
        {profile.listings.length} обяви · {pending.length} чакащи заявки
      </p>

      {(sp.created || sp.updated || sp.deleted) && (
        <p className="mt-4 rounded-xl bg-cobble-50 px-4 py-3 text-sm text-cobble-800 dark:bg-cobble-950/40 dark:text-cobble-200">
          {sp.created ? "✓ Обявата е публикувана." : sp.updated ? "✓ Обявата е обновена." : "✓ Обявата е изтрита."}
        </p>
      )}

      {/* Incoming bookings */}
      <h2 className="mt-8 text-lg font-semibold">Входящи заявки</h2>
      {bookings.length === 0 ? (
        <p className="mt-2 text-black/50 dark:text-white/50">Все още няма заявки.</p>
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
                  {b.message ? ` · „${b.message}“` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/chat/${b.id}`}
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-cobble-700 transition hover:border-cobble-500/40"
                >
                  Чат
                </Link>
                {b.status === "REQUESTED" && (
                  <>
                    <StatusButton bookingId={b.id} status="ACCEPTED" label="Приеми" variant="primary" />
                    <StatusButton bookingId={b.id} status="DECLINED" label="Откажи" variant="ghost" />
                  </>
                )}
                {b.status === "ACCEPTED" && (
                  <StatusButton bookingId={b.id} status="COMPLETED" label="Завърши" variant="primary" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Listings */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Моите обяви</h2>
        <Link
          href="/dashboard/listings/new"
          className="rounded-lg bg-cobble-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-cobble-700"
        >
          + Нова обява
        </Link>
      </div>
      {profile.listings.length === 0 ? (
        <p className="mt-3 text-black/50 dark:text-white/50">
          No listings yet — <Link href="/dashboard/listings/new" className="font-medium text-cobble-600 hover:underline">създайте първата</Link>.
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {profile.listings.map((l) => (
            <li key={l.id} className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/45 dark:text-white/45">
                  {l.category.icon} {l.category.name}
                </span>
                <span className="font-semibold text-cobble-700 dark:text-cobble-400">
                  {formatPrice(l.priceType, l.price)}
                </span>
              </div>
              <Link href={`/listing/${l.id}`} className="mt-1 block font-medium hover:text-cobble-600">
                {l.title}
              </Link>
              <p className="mt-1 text-xs text-black/45 dark:text-white/45">
                {l._count.bookings} заявки · {l._count.reviews} отзива
              </p>
              <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3 dark:border-white/10">
                <Link
                  href={`/dashboard/listings/${l.id}/edit`}
                  className="rounded-lg border border-black/10 px-3 py-1 text-xs font-medium transition hover:border-cobble-500/40 dark:border-white/15"
                >
                  Редактирай
                </Link>
                <form action={deleteListing}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="rounded-lg border border-black/10 px-3 py-1 text-xs font-medium text-black/60 transition hover:border-red-300 hover:text-red-600 dark:border-white/15 dark:text-white/60">
                    Изтрий
                  </button>
                </form>
                {!l.active && (
                  <span className="rounded-lg bg-black/5 px-2 py-1 text-xs text-black/50 dark:bg-white/10 dark:text-white/50">
                    Скрита
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
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
      ? "rounded-lg bg-cobble-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-cobble-700"
      : "rounded-lg border border-black/10 px-3 py-1.5 text-sm text-black/60 transition hover:border-red-300 hover:text-red-600 dark:border-white/15 dark:text-white/60";
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="status" value={status} />
      <button className={cls}>{label}</button>
    </form>
  );
}
