# SEO отчетност и измерване — „Под ръка"

Какво меним, къде се вижда и какво гледаме всяка седмица. Стекът е безплатен
и без бисквитки → **не изисква cookie consent банер**.

## Инструменти

| Инструмент | Какво дава | Еднократна настройка |
| ---------- | ---------- | -------------------- |
| Google Search Console | Импресии, кликове, CTR, позиции по заявка/страница; индексиране | GSC → Add property → HTML tag → сложи токена като `GOOGLE_SITE_VERIFICATION` във Vercel → Redeploy → Verify. После Sitemaps → подай `sitemap.xml` |
| Vercel Analytics | Посещения, източници, страници + продуктовите ни събития | Vercel → проектът → Analytics → Enable (кодът е вграден: `<Analytics/>` в `layout.tsx`) |

## Продуктови събития (вградени)

Изпращат се server-side от съответното действие; виждат се във Vercel
Analytics → Events. Никога не чупят действието (`src/lib/track.ts` гълта грешки).

| Събитие | Кога | Свойства |
| ------- | ---- | -------- |
| `sign_up` | успешна регистрация | `role` (CUSTOMER/PROVIDER), `referred` |
| `booking_requested` | клиент подава заявка | `city` |
| `review_submitted` | клиент оставя отзив | `rating` |

Фунията: **посещение → sign_up → booking_requested → review_submitted**.
Ново събитие се добавя с един ред: `await track("име", { свойство })`.

## KPI (гледай седмично, ~15 минути)

1. **GSC → Performance**: импресии и кликове общо + поотделно за трите типа
   входни страници — категорийните (`/services/[slug]`), блога (`/blog/…`) и
   обявите (`/listing/…`). Растящи импресии при нисък CTR = добра позиция,
   слаб title/description — пренапиши го.
2. **GSC → Indexing → Pages**: неиндексирани страници, които очакваме да са
   вътре (категорийните landing-и са най-важни).
3. **Vercel Analytics**: посещения по източник (organic vs. direct vs. social)
   и конверсия посещение → `sign_up` → `booking_requested` (процентите между
   стъпалата са здравето на продукта; движението им седмица-към-седмица е
   по-важно от абсолютните числа).
4. Запиши трите числа (кликове от Google, sign_ups, booking_requested) в
   `pm/` бележките на спринта — трендът за 4+ седмици е реалният сигнал.

## Предпоставки, за да е верен този отчет

- `NEXT_PUBLIC_SITE_URL` да сочи живия origin (иначе sitemap-ът подава
  чужди URL-и на Google — виж plans/PROGRESS.md, roadmap-05).
- GSC property-то да съвпада със същия origin; при смяна на домейн
  (`podruka.bg`) — ново property + Change of Address.
