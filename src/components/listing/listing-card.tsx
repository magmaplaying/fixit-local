import Link from "next/link";
import Image from "next/image";
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
  featured?: boolean;
};

export function ListingCard({ l }: { l: ListingCardData }) {
  const meta = `${l.categoryName} · ${l.area ?? l.city}`.toUpperCase();
  return (
    <Link
      href={`/listing/${l.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_3px_rgba(33,26,19,0.06),0_10px_24px_-18px_rgba(33,26,19,0.22)] transition hover:-translate-y-0.5 hover:border-cobble-500/60 hover:shadow-[0_12px_28px_-14px_rgba(28,26,23,0.4)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-cobble-50">
        {l.distanceKm != null && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-espresso/85 px-2.5 py-1 font-mono text-[11px] font-medium text-background backdrop-blur-sm">
            📍 {formatDistance(l.distanceKm)}
          </span>
        )}
        {l.featured && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-cobble-600 px-2.5 py-1 font-mono text-[11px] font-semibold text-white shadow-sm">
            ★ Издигната
          </span>
        )}
        {l.imageUrl ? (
          <Image
            src={l.imageUrl}
            alt={l.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl" aria-hidden>
            {l.categoryIcon}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="font-mono text-[11px] font-medium tracking-[0.1em] text-cobble-700">{meta}</div>
        <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-espresso transition group-hover:text-cobble-800">
          {l.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 text-sm text-black/60">
          <span className="min-w-0 truncate">{l.providerName}</span>
          <Rating rating={l.rating} count={l.reviewCount} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-dashed border-black/15 pt-3">
          <span className="font-mono text-base font-bold text-espresso">{l.priceLabel}</span>
          <span className="font-mono text-xs font-medium tracking-wide text-cobble-700 transition group-hover:text-cobble-800">
            ВИЖ →
          </span>
        </div>
      </div>
    </Link>
  );
}

function Rating({ rating, count }: { rating: number | null; count: number }) {
  if (rating == null) return <span className="shrink-0 font-mono text-[11px] font-medium text-cobble-700">· НОВО</span>;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-cobble-50 px-1.5 py-0.5">
      <span className="text-cobble-500" aria-hidden>
        ★
      </span>
      <span className="font-mono text-xs font-bold text-espresso">{rating.toFixed(1)}</span>
      <span className="font-mono text-[11px] text-black/40">({count})</span>
    </span>
  );
}
