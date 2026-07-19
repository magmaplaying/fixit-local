export function formatPrice(priceType: string, price: number | null): string {
  if (priceType === "QUOTE" || price == null) return "По договаряне";
  const amount = `€${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
  if (priceType === "HOURLY") return `${amount}/час`;
  return amount; // FIXED
}

export function parsePhotos(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function averageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

/**
 * Parse an <input type="date"> ("YYYY-MM-DD") or type="datetime-local"
 * ("YYYY-MM-DDTHH:mm") value into a Date. The wall-clock is pinned to UTC via
 * Date.UTC so the stored instant renders back identically regardless of the
 * server's timezone (Vercel runs in UTC, local dev may not) — the whole app is
 * single-timezone (Bulgaria), so a naive `new Date(str)` would shift the hour by
 * the server offset. Pairs with formatSchedule. Returns null for empty/invalid.
 */
export function parseSchedule(input: string | null | undefined): Date | null {
  if (!input) return null;
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, h, min] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, h ? +h : 0, min ? +min : 0));
}

/** Render a scheduled slot in Bulgarian: date, plus the time when one was picked. */
export function formatSchedule(date: Date): string {
  const hasTime = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0;
  return date.toLocaleString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "UTC",
  });
}

/** Short Bulgarian relative time, e.g. "сега", "преди 5 мин", "преди 3 ч", "вчера". */
export function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "сега";
  const m = Math.floor(s / 60);
  if (m < 60) return `преди ${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `преди ${h} ч`;
  const d = Math.floor(h / 24);
  if (d === 1) return "вчера";
  if (d < 7) return `преди ${d} дни`;
  return date.toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
