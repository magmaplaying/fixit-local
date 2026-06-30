import { prisma } from "@/lib/db";
import { setReviewHidden } from "@/app/_actions/admin";

export default async function AdminReviews() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true, listing: { select: { title: true } } },
    take: 200,
  });

  return (
    <ul className="space-y-2">
      {reviews.map((r) => (
        <li
          key={r.id}
          className={`rounded-xl border p-3 text-sm dark:border-white/10 ${
            r.hidden ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : "border-black/5 bg-white dark:bg-white/5"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-amber-500" aria-hidden>
                {"★".repeat(r.rating)}
                <span className="text-black/15 dark:text-white/15">{"★".repeat(5 - r.rating)}</span>
              </span>{" "}
              <span className="font-medium">{r.author.name}</span>{" "}
              <span className="text-black/45 dark:text-white/45">· {r.listing.title}</span>
            </div>
            <form action={setReviewHidden}>
              <input type="hidden" name="reviewId" value={r.id} />
              <input type="hidden" name="hidden" value={r.hidden ? "false" : "true"} />
              <button className="rounded-lg border border-black/10 px-3 py-1 text-xs font-medium transition hover:border-cobble-500/40 dark:border-white/15">
                {r.hidden ? "Покажи" : "Скрий"}
              </button>
            </form>
          </div>
          {r.comment && <p className="mt-1.5 text-black/70 dark:text-white/70">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
