// Bulgarian cities offered in the city pickers. Stored on profiles/listings
// as plain Cyrillic strings; "" in a filter means "all of Bulgaria".
export const CITIES = [
  "София",
  "Пловдив",
  "Варна",
  "Бургас",
  "Русе",
  "Стара Загора",
  "Плевен",
  "Сливен",
  "Добрич",
  "Шумен",
  "Перник",
  "Хасково",
  "Ямбол",
  "Пазарджик",
  "Благоевград",
  "Велико Търново",
  "Враца",
  "Габрово",
  "Видин",
  "Монтана",
  "Кърджали",
  "Казанлък",
  "Кюстендил",
  "Асеновград",
  "Димитровград",
  "Търговище",
  "Силистра",
  "Ловеч",
  "Разград",
  "Дупница",
  "Свищов",
  "Смолян",
];

// Bulgarian → Latin (official streamlined transliteration) for URL-safe slugs.
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

// Common English forms preferred over strict transliteration (better for search).
const CITY_SLUG_OVERRIDES: Record<string, string> = { София: "sofia" };

/** ASCII, URL-safe slug for a Bulgarian city name, e.g. "София" → "sofia". */
export function citySlug(city: string): string {
  if (CITY_SLUG_OVERRIDES[city]) return CITY_SLUG_OVERRIDES[city];
  return city
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? (ch === " " ? "-" : /[a-z0-9-]/.test(ch) ? ch : ""))
    .join("");
}

const CITY_BY_SLUG: Record<string, string> = Object.fromEntries(CITIES.map((c) => [citySlug(c), c]));

/** Resolve a city slug back to its Cyrillic name, or null if unknown. */
export function cityFromSlug(slug: string): string | null {
  return CITY_BY_SLUG[slug] ?? null;
}
