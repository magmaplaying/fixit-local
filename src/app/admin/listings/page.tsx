import Link from "next/link";
import { prisma } from "@/lib/db";
import { setListingActive } from "@/app/_actions/admin";

export default async function AdminListings() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: { provider: { include: { user: true } }, category: true },
    take: 200,
  });

  return (
    <ul className="space-y-2">
      {listings.map((l) => (
        <li
          key={l.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/5 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <div className="min-w-0">
            <Link href={`/listing/${l.id}`} className="font-medium hover:text-cobble-600">
              {l.title}
            </Link>{" "}
            <span className="text-black/45 dark:text-white/45">
              · {l.category.name} · {l.provider.user.name}
            </span>
            {!l.active && (
              <span className="ml-2 rounded bg-black/[0.06] px-1.5 py-0.5 text-xs text-black/50 dark:bg-white/10 dark:text-white/50">
                скрита
              </span>
            )}
          </div>
          <form action={setListingActive}>
            <input type="hidden" name="listingId" value={l.id} />
            <input type="hidden" name="active" value={l.active ? "false" : "true"} />
            <button
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                l.active
                  ? "border-red-300 text-red-700 hover:bg-red-50"
                  : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {l.active ? "Скрий" : "Покажи"}
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
