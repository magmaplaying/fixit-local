# Маркетинг — „Под ръка"

Готови за ползване плейбукове за растеж на marketplace-а. Стратегическа рамка: **концентрация** — един град (София) + 2–3 сезонни категории, предлагането се решава с ръчна работа (безплатно), бюджетът (€100–300/мес) отива за концентрирано клиентско търсене. Цел за първите 90 дни: ~50 успешни поръчки с отзиви в София.

## Файлове

| # | Файл | За какво |
|---|---|---|
| 01 | [partnerships.md](01-partnerships.md) | Партньорства за дистрибуция (домоуправители, брокери, магазини, хостове) + готови съобщения |
| 02 | [provider-recruitment.md](02-provider-recruitment.md) | Систематичен набор на 30 изпълнителя + скрипт и възражения |
| 07 | [registration-invite-email.md](07-registration-invite-email.md) | Готов имейл (plain text + HTML) за покана на нови хора да се регистрират |
| 06 | [facebook-lead-posts.md](06-facebook-lead-posts.md) | Готови FB постове за реални клиентски заявки (стъпка 1, преди обажданията) |
| 03 | [price-guides.md](03-price-guides.md) | SEO ценови водачи „Колко струва X в София" |
| 04 | [pr-kit.md](04-pr-kit.md) | Безплатен PR — ъгли, boilerplate, pitch, медии |
| 05 | [build-in-public.md](05-build-in-public.md) | Личен бранд / build-in-public — стълбове и стартови постове |
| 09 | [seasonal-calendar.md](09-seasonal-calendar.md) | Коя категория да буташ кой месец |
| 10 | [reviews-engine.md](10-reviews-engine.md) | Двигател за отзиви и social proof |

## Свързано в кода (вече изградено)
- Share бутони с UTM (обяви + профили), реферали (`/invite`), блог (`/blog`).
- Lifecycle имейли: `src/lib/campaigns.ts` + дневен cron (`src/app/api/cron/lifecycle`). Активиране: `RESEND_API_KEY`, `EMAIL_FROM` (верифициран домейн), `CRON_SECRET` в Vercel.

## Още за платените канали (т.6–8 в плана от чата)
Meta реклами (София, сезонни категории), retargeting, малко Google Search — точните бюджети по категория чакат: цена на „Топ обява" + потвърждение за старт само със София.
