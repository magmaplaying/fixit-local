export function formatPrice(priceType: string, price: number | null): string {
  if (priceType === "QUOTE" || price == null) return "Quote on request";
  const amount = `€${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
  if (priceType === "HOURLY") return `${amount}/hr`;
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

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
