import { cityCoords, osmEmbedUrl, osmLinkUrl, type LatLng } from "@/lib/geo";

/**
 * Key-free map card backed by OpenStreetMap's embed iframe. Resolves a city
 * name to approximate coordinates; renders nothing if the city is unknown.
 * Pure presentational — no client JS, safe inside Server Components.
 */
export function LocationMap({
  city,
  area,
  className,
}: {
  city: string;
  area?: string | null;
  className?: string;
}) {
  const point: LatLng | null = cityCoords(city);
  if (!point) return null;

  const label = area ? `${area}, ${city}` : city;

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
        <iframe
          title={`Карта — ${label}`}
          src={osmEmbedUrl(point)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="aspect-[16/9] w-full"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm text-black/55 dark:text-white/55">
        <span>📍 {label} <span className="text-black/35 dark:text-white/35">(приблизително)</span></span>
        <a
          href={osmLinkUrl(point)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-cobble-600 hover:underline"
        >
          Виж по-голяма карта →
        </a>
      </div>
    </div>
  );
}
