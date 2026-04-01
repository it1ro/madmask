# Технический SEO‑аудит (по коду) — Madmask

Дата: 2026-04-01  
Scope: пункт **«1) Технический аудит»** из плана `seo-audit-madmask_b5d2768e.plan.md` (без GSC).

## Короткий вывод

- **High**: `robots.txt` пустой; **нет** `sitemap.xml`; **нет** `<link rel="canonical">`; **нет** политики 301 для `www`↔`non-www`; служебные страницы (`/admin`, `/cart`, `/wishlist`, `/inquiries/thanks`, `/up`) **не закрыты** от индексации; `og:image`/`twitter:image` сейчас **относительные**.
- **Medium**: `og:url` сейчас берётся из `request.original_url` → может фиксировать параметризованные URL (например, `?category=`) как «каноничные» в соц. превью; URL товаров без slug.
- **Low**: частичный рендер `products#show` при `turbo_frame_request?` потенциально даёт «неполную» HTML-версию (в норме краулеры так не ходят, но лучше держать под контролем через canonical/noindex для тех.вариантов).

## 1.1 Robots.txt

**Факт:** `public/robots.txt` содержит только комментарий.

Файл: `public/robots.txt`.

**Риск:** нет управления обходом и нет ссылки на sitemap.

**Рекомендации (High):**

- Добавить явные правила `Disallow` для служебных зон: `/admin`, `/users` (Devise), `/cart`, `/wishlist`, `/up`.
- Добавить строку `Sitemap: https://<canonical_host>/sitemap.xml`.
- Определить стратегию для `/inquiries/*`:
  - `thanks` — точно `noindex`;
  - `new` — либо index (если это «Контакты/Заявка» как landing с контентом), либо `noindex` (если чисто тех.форма).

## 1.2 Sitemap.xml

**Факт:** генерации sitemap в репозитории не найдено; файлов `sitemap*` нет.

**Рекомендации (High):**

- Внедрить генерацию `sitemap.xml`, включив:
  - `/` (home), `/products` и `products#show` для всех товаров;
  - опционально «категорийные» страницы (см. политику ниже про canonical/индексацию фильтров).
- Исключить: `/admin`, `/cart`, `/wishlist`, Devise‑маршруты.
- Прописать в `robots.txt` ссылку на sitemap.

## 1.3 Canonical

**Факт:** в `app/views/layouts/application.html.erb` нет `<link rel="canonical">` (в коде canonical не найден).

Файл: `app/views/layouts/application.html.erb`.

**Риски (High):**

- Дубликаты из-за параметров на каталоге (`/products?category=...`).
- Дубликаты по хосту (оба `madmask.ilmir.tech` и `www.madmask.ilmir.tech` разрешены).

**Рекомендации (High):**

- Добавить canonical на каждой индексируемой странице.
- Для `products#index` выбрать стратегию:
  - **вариант A (проще):** фильтры не ранжируем → canonical всегда на `/products`, а страницы с `?category=` либо `noindex,follow`, либо оставить crawlable, но не индексируемые;
  - **вариант B (SEO‑посадочные):** фильтры ранжируем → canonical на URL с `?category=` и сделать их полноценными (уникальные Title/Description/H1 + текст).

## 1.4 Редиректы http/https, www/non‑www

**Факт:**

- В проде включены `config.assume_ssl = true` и `config.force_ssl = true` → редирект на HTTPS есть.
- Разрешены оба хоста (`madmask.ilmir.tech` и `www.madmask.ilmir.tech`) в `config/environments/production.rb`.
- Политики canonical host (301 `www`→`non-www` или наоборот) в коде не обнаружено.

Файл: `config/environments/production.rb`.

**Рекомендации (High):**

- Выбрать один **канонический хост** и настроить 301 редирект со второго.
- Синхронизировать:
  - canonical URL,
  - `og:url`,
  - sitemap,
  - генерацию абсолютных URL (см. 1.7 и 1.10).

## 1.5 Index / noindex для служебных страниц

**Факт:**

- Статические error‑страницы (`public/400.html`, `404.html`, `406-unsupported-browser.html`, `422.html`, `500.html`) уже содержат `<meta name="robots" content="noindex, nofollow">` — это хорошо.
- Для динамических служебных страниц `admin`, `cart`, `wishlist`, `inquiries#thanks`, `up` — явного `noindex` не найдено.

Файлы: `public/*.html`, маршруты в `config/routes.rb`.

**Рекомендации (High):**

- Ввести правило `noindex` для:
  - `/admin/*`,
  - `/cart`, `/wishlist`,
  - `/inquiries/thanks`,
  - `/up`,
  - Devise‑страниц (если они доступны без логина).
- Реализация: meta robots в layout по контроллеру/пути и/или `X‑Robots‑Tag` на уровне middleware/контроллеров (предпочтительно для «технических» страниц).

## 1.6 Core Web Vitals / скорость (code‑risks)

**Факт по layout:** на всех страницах присутствует `<canvas data-controller="cursor-smoke">` (фон‑эффект).

Файл: `app/views/layouts/application.html.erb`.

**Факт по WebGL:** `Three.js` подключается через `yield :three_js` (по задумке — только `products#show`).

**Риски (High/Medium):**

- INP/CPU на мобильных из-за постоянного canvas‑эффекта.
- LCP на `products#show` из-за WebGL/изображений и JS.

**Рекомендации:**

- Сделать замеры Lighthouse минимум для `/`, `/products`, `/products/:id`, `/inquiries/new`.
- Отключать/деградировать `cursor-smoke` на mobile и при `prefers-reduced-motion`.
- Жёстко контролировать DPR/размер canvas.
- Грузить тяжёлые WebGL‑модули только при реальной необходимости (например, при выборе 3D‑слайда).

## 1.7 OG/Twitter: абсолютные URL изображений

**Факт:** в layout `meta_image` по умолчанию равен `"/images/site-hero.png"`, а затем используется как `og:image` и `twitter:image` (т.е. относительный URL).

Файл: `app/views/layouts/application.html.erb`.

**Риск (High):** часть парсеров соцсетей ожидают абсолютный URL → превью может ломаться/быть нестабильным.

**Рекомендации (High):**

- Делать `og:image`/`twitter:image` абсолютными (`https://<canonical_host>/...`).
- Для товара — подставлять его обложку (Active Storage) и тоже абсолютным URL.

## 1.8 Структура URL товаров (slug)

**Факт:** `ProductsController#show` использует `Product.find(params[:id])` → URL вида `/products/123`.

Файл: `app/controllers/products_controller.rb`.

**Рекомендации (Medium):**

- Ввести slug (`/products/<slug>` или `/products/123-slug`) + 301 со старых URL + canonical на новый формат.

## 1.9 Дубликаты / параметры / Turbo Frames

**Факты:**

- Каталог фильтруется параметром `?category=` (`ProductsController#index`).
- `products#show` при `turbo_frame_request?` рендерит partial без layout.

Файл: `app/controllers/products_controller.rb`.

**Риски:**

- Дубли каталога по параметрам (High) → решается canonical + политика индексации фильтров.
- Частичный HTML‑рендер для Turbo (Low) → косвенно решается canonical + noindex для технических вариантов (если потребуется).

## 1.10 OG `og:url`

**Факт:** `meta_url` по умолчанию равен `request.original_url`, и это идёт в `og:url`.

Файл: `app/views/layouts/application.html.erb`.

**Риски (Medium):**

- В соц.превью может попадать URL с параметрами/не каноничным хостом.

**Рекомендации (High/Medium):**

- Завести единый «канонический URL» для страницы (и использовать его одновременно для `canonical` и `og:url`).

## Приоритетный список работ (из техаудита)

- **High**: `robots.txt` + `sitemap.xml` + canonical + 301 для `www/non-www` + `noindex` для служебных + абсолютные OG/Twitter URL.
- **Medium**: уникальные meta (catalog/category/product) + slug товаров.
- **Medium/Low**: CWV‑оптимизации (после замеров) + тонкая настройка поведения Turbo/WebGL/canvas.

