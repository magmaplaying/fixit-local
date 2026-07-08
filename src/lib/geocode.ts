import "server-only";
import type { LatLng } from "@/lib/geo";

// Best-effort geocoding via OpenStreetMap Nominatim (key-free). Call this at
// WRITE time only (profile/listing save) and store the result — Nominatim's
// usage policy forbids per-request geocoding, and storing doubles as the cache.
// Any failure returns null so the caller falls back to city-center coords.

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

export async function geocodeArea(
  area: string | null | undefined,
  city: string,
): Promise<LatLng | null> {
  // No neighbourhood → nothing more precise than the city centre we already
  // have; skip the request and let the city-center fallback handle it.
  if (!area || !area.trim()) return null;

  const q = `${area.trim()}, ${city}, България`;
  const url = `${ENDPOINT}?${new URLSearchParams({
    q,
    format: "jsonv2",
    limit: "1",
    countrycodes: "bg",
  })}`;

  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim requires a descriptive UA identifying the app.
        "User-Agent": "PodRuka/1.0 (https://www.podruka.bg)",
        "Accept-Language": "bg",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = data[0];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null; // network error / timeout / bad JSON — fall back gracefully
  }
}
