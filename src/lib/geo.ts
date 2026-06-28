// Lightweight, key-free geo helpers.
//
// Listings/profiles store the city as a plain Cyrillic string (see `cities.ts`),
// not coordinates. We map each known city to an approximate center point here so
// we can render a map and do "near me" proximity search without a paid geocoder.
// Precision is city-level by design — honest for an MVP where providers only
// pick a city + neighbourhood.

export type LatLng = { lat: number; lng: number };

// Approximate city-center coordinates for every city in `CITIES`.
export const CITY_COORDS: Record<string, LatLng> = {
  София: { lat: 42.6977, lng: 23.3219 },
  Пловдив: { lat: 42.1354, lng: 24.7453 },
  Варна: { lat: 43.2141, lng: 27.9147 },
  Бургас: { lat: 42.5048, lng: 27.4626 },
  Русе: { lat: 43.8356, lng: 25.9657 },
  "Стара Загора": { lat: 42.4258, lng: 25.6345 },
  Плевен: { lat: 43.417, lng: 24.6067 },
  Сливен: { lat: 42.6858, lng: 26.3292 },
  Добрич: { lat: 43.5726, lng: 27.8273 },
  Шумен: { lat: 43.2706, lng: 26.9361 },
  Перник: { lat: 42.605, lng: 23.0378 },
  Хасково: { lat: 41.9344, lng: 25.5554 },
  Ямбол: { lat: 42.4842, lng: 26.5034 },
  Пазарджик: { lat: 42.1928, lng: 24.3336 },
  Благоевград: { lat: 42.0203, lng: 23.0942 },
  "Велико Търново": { lat: 43.0757, lng: 25.6172 },
  Враца: { lat: 43.2102, lng: 23.5527 },
  Габрово: { lat: 42.8742, lng: 25.334 },
  Видин: { lat: 43.9961, lng: 22.8672 },
  Монтана: { lat: 43.4125, lng: 23.2257 },
  Кърджали: { lat: 41.6339, lng: 25.3686 },
  Казанлък: { lat: 42.6195, lng: 25.3937 },
  Кюстендил: { lat: 42.2844, lng: 22.6911 },
  Асеновград: { lat: 42.0103, lng: 24.8765 },
  Димитровград: { lat: 42.05, lng: 25.6 },
  Търговище: { lat: 43.2487, lng: 26.5723 },
  Силистра: { lat: 44.117, lng: 27.2606 },
  Ловеч: { lat: 43.137, lng: 24.714 },
  Разград: { lat: 43.5263, lng: 26.524 },
  Дупница: { lat: 42.2667, lng: 23.1167 },
  Свищов: { lat: 43.6211, lng: 25.3508 },
  Смолян: { lat: 41.5775, lng: 24.7124 },
};

export function cityCoords(city: string | null | undefined): LatLng | null {
  if (!city) return null;
  return CITY_COORDS[city] ?? null;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Nearest known city to a point, or null if the city table is empty. */
export function nearestCity(point: LatLng): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const d = haversineKm(point, coords);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

/** Parse a `"lat,lng"` query param into a point, validating ranges. */
export function parseLatLng(value: string | null | undefined): LatLng | null {
  if (!value) return null;
  const [latStr, lngStr] = value.split(",");
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/** Human-friendly distance label, e.g. `≈ 450 м` or `≈ 12 км`. */
export function formatDistance(km: number): string {
  if (km < 1) return `≈ ${Math.round(km * 1000)} м`;
  if (km < 10) return `≈ ${km.toFixed(1)} км`;
  return `≈ ${Math.round(km)} км`;
}

/**
 * Build an embeddable OpenStreetMap URL (no API key) for an `<iframe>`,
 * centered on `point` with a marker. `span` controls the bounding-box size in
 * degrees — smaller = more zoomed in.
 */
export function osmEmbedUrl(point: LatLng, span = 0.06): string {
  const minLng = point.lng - span;
  const minLat = point.lat - span;
  const maxLng = point.lng + span;
  const maxLat = point.lat + span;
  const params = new URLSearchParams({
    bbox: `${minLng},${minLat},${maxLng},${maxLat}`,
    layer: "mapnik",
    marker: `${point.lat},${point.lng}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

/** Link to the full OpenStreetMap site, centered/marked on `point`. */
export function osmLinkUrl(point: LatLng, zoom = 13): string {
  return `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=${zoom}/${point.lat}/${point.lng}`;
}
