import Link from "next/link";

export type ListingCardData = {
  id: string;
  title: string;
  city: string;
  area: string | null;
  priceLabel: string;
  categoryName: string;
  categoryIcon: string | null;
  providerName: string;
  rating: number | null;
  reviewCount: number;
};

export function ListingCard({ l }: { l: ListingCardData }) {
  return (
    <Link
      href={`/listing/${l.id}`}
      className="group flex flex-col rounded-xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-md dark:border-white/10 dark:bg-white/5"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
          <span aria-hidden>{l.categoryIcon}</span>
          {l.categoryName}
        </span>
        <Rating rating={l.rating} count={l.reviewCount} />
      </div>

      <h3 className="font-semibold leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-400">
        {l.title}
      </h3>
      <p className="mt-1 text-sm text-black/55 dark:text-white/55">
        {l.providerName} · {l.area ? `${l.area}, ` : ""}
        {l.city}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 dark:border-white/10">
        <span className="font-semibold text-teal-700 dark:text-teal-400">{l.priceLabel}</span>
        <span className="text-sm text-black/40 transition group-hover:text-teal-600 dark:text-white/40">
          View →
        </span>
      </div>
    </Link>
  );
}

function Rating({ rating, count }: { rating: number | null; count: number }) {
  if (rating == null) {
    return <span className="text-xs text-black/40 dark:text-white/40">No reviews yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-500" aria-hidden>
        ★
      </span>
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-xs text-black/40 dark:text-white/40">({count})</span>
    </span>
  );
}
