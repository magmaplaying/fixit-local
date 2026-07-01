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
