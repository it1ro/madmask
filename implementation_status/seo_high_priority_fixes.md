# SEO — High‑priority fixes (robots/sitemap/canonical/host/noindex/OG)

Дата: 2026-04-01

## Сделано

- `public/robots.txt`: добавлены правила `Disallow` для служебных зон + `Sitemap`.
- `/sitemap.xml`: добавлен маршрут и контроллер `SitemapsController#show` (включает home, каталог, все товары).
- Canonical:
  - добавлен `<link rel="canonical">` в `app/views/layouts/application.html.erb`;
  - `og:url` теперь по умолчанию канонический.
- Абсолютные OG/Twitter URL:
  - `og:image` и `twitter:image` теперь формируются как абсолютные URL через helper.
- Noindex для служебных страниц:
  - добавлен `meta name="robots" content="noindex, follow"` по умолчанию для `/admin`, `/users`, `/cart`, `/wishlist`, `/up`, `/inquiries/thanks`.
- Canonical host redirect:
  - добавлен middleware `CanonicalHostRedirect` и включён в `production` для 301 редиректа на `APP_HOST` (по умолчанию `madmask.ilmir.tech`).

## Примечания / что проверить вручную

- Редирект `www`→`non-www` в проде (и отсутствие редиректа в dev).
- Доступность `sitemap.xml` по HTTPS на прод‑хосте.
- Корректность canonical/OG на страницах с параметрами (`/products?category=...`): это уже базовая защита от «залипания» неканоничных URL в OG, но политику индексации фильтров лучше зафиксировать отдельно.

