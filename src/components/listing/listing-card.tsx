import Link from "next/link";
import { formatDistance } from "@/lib/geo";

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
  imageUrl: string | null;
  distanceKm?: number | null;
};

export function ListingCard({ l }: { l: ListingCardData }) {
  const meta = `${l.categoryName} · ${l.area ?? l.city}`.toUpperCase();
  return (
    <Link
      href={`/listing/${l.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white transition hover:-translate-y-0.5 hover:border-cobble-500/50 hover:shadow-[0_8px_24px_-14px_rgba(28,26,23,0.35)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-cobble-50">
        {l.distanceKm != null && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-espresso/85 px-2.5 py-1 font-mono text-[11px] font-medium text-background backdrop-blur-sm">
            📍 {formatDistance(l.distanceKm)}
          </span>
        )}
        {l.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={l.imageUrl}
            alt={l.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl" aria-hidden>
            {l.categoryIcon}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="font-mono text-[11px] tracking-[0.08em] text-cobble-900/70">{meta}</div>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug transition group-hover:text-cobble-800">
          {l.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-black/55">
          <span>{l.providerName}</span>
          <Rating rating={l.rating} count={l.reviewCount} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-dashed border-black/20 pt-3">
          <span className="rounded-md bg-cobble-100 px-2.5 py-1 font-mono text-sm font-medium text-cobble-900">
            {l.priceLabel}
          </span>
          <span className="font-mono text-xs tracking-wide text-black/40 transition group-hover:text-cobble-700">
            ВИЖ →
          </span>
        </div>
      </div>
    </Link>
  );
}

function Rating({ rating, count }: { rating: number | null; count: number }) {
  if (rating == null) return <span className="font-mono text-[11px] text-black/35">· НОВО</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-cobble-500" aria-hidden>
        ★
      </span>
      <span className="font-mono text-xs font-medium">{rating.toFixed(1)}</span>
      <span className="font-mono text-[11px] text-black/35">({count})</span>
    </span>
  );
}
