# SEO-аудит — Backlog (что осталось / не до конца / риск некорректности)

Дата: 2026-04-01

Источник: план `seo-audit-madmask_b5d2768e.plan.md`.

## Уже сделано (сверено по коду)

См. `implementation_status/seo_high_priority_fixes.md`:

- `robots.txt` с `Disallow` + `Sitemap`.
- `/sitemap.xml` (маршрут + `SitemapsController`).
- `<link rel="canonical">` + `og:url`.
- Абсолютные `og:image`/`twitter:image`.
- `noindex` (meta robots) для `/admin`, `/users`, `/cart`, `/wishlist`, `/up`, `/inquiries/thanks`.
- 301 редирект на канонический хост (middleware).

## Backlog

### High

- **Уникальные meta description для каталога и карточек товара**
  - **Почему**: сейчас на `/products` и `/products/:id` `meta_description` не задаётся (в layout он рендерится только если задан через `content_for`).
  - **Готово когда**:
    - `/products` имеет `meta description` (общий).
    - `/products?category=...` имеет `meta description` + (если индексируем) уникальный Title/H1.
    - `/products/:id` имеет `meta description` (из `description` или шаблона) и `meta_image` (обложка товара), при этом URL/OG остаются каноничными.

- **Политика индексации фильтра `?category=`**
  - **Почему**: сейчас есть отдельные «каталожные» URL по жанрам, но нет зафиксированной стратегии (каноникал/индексация/уникальный контент).
  - **Варианты**:
    - **A**: не индексировать фильтры → canonical на `/products` + (опционально) `noindex, follow` для страниц с параметрами.
    - **B**: индексировать жанры → уникальные Title/H1/Description + текст/FAQ + стабильный canonical на сам URL жанра.
  - **Готово когда**: выбран вариант и реализован (мета + canonical/noindex + контент при варианте B).

- **Решить судьбу `/inquiries/new` (index vs noindex) и привести к единой стратегии**
  - **Сейчас**: `noindex` включён только для `/inquiries/thanks`; `/inquiries/new` остаётся индексируемой по умолчанию.
  - **Готово когда**: принято решение и реализовано (robots/meta robots + полноценный контент/мета если оставляем index).

### Medium

- **Нормализация `canonical_host` для редиректа и sitemap (устранить риск некорректной конфигурации)**
  - **Риск**: если `config.x.canonical_host` зададут как URL (`https://...`) или с портом, текущий `CanonicalHostRedirect` и `SitemapsController` ожидают «чистый host».
  - **Готово когда**:
    - middleware сравнивает/подставляет нормализованный host;
    - sitemap строит URL с корректным host/port (консистентно с canonical helper).

- **CWV: замеры и план оптимизаций (LCP/INP/CLS)**
  - **Готово когда**:
    - есть замеры Lighthouse/PSI для `/`, `/products`, `/products/:id`, `/inquiries/new`;
    - заведены конкретные подзадачи по результатам (например: mobile/reduced-motion для `cursor-smoke`, лимит DPR/размера canvas, отложенная инициализация WebGL).

- **Категорийные посадочные страницы как полноценные SEO-лендинги (если выбрана индексация жанров)**
  - **Готово когда**: у каждой категории есть человекочитаемая страница/URL-стратегия, текст, FAQ, перелинковка.

- **ЧПУ для товаров (slug) + 301 со старых URL**
  - **Готово когда**: `/products/<slug>` (или `/products/:id-:slug`), редиректы, canonical на новый URL, sitemap обновлён.

### Low

- **Расширение OG (опционально `og:type` = product/website по контексту)**
  - **Готово когда**: корректные OG поля на товаре/каталоге (без регрессий на шаринге).

