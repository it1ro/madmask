## Цель
- Ускорить загрузку главной страницы `/` без рискованных архитектурных изменений.
- Сфокусироваться на quick wins по TTFB, latency и клиентской нагрузке (desktop + mobile).

## Что изменено

### 1) Убраны лишние запросы к вложениям в блоке "Новинки"
- Файл: `/home/itiro/dev/madmask/app/controllers/pages_controller.rb`
- В `PagesController#home` добавлена предзагрузка вложений:
  - `with_attached_cover_image`
  - `with_attached_cover_image_optimized`
  - `with_attached_gallery_images`
  - `with_attached_gallery_images_optimized`
  - `includes(:model_file_attachment)`

Ожидаемый эффект: меньше N+1 и стабильнее серверный ответ на `/`.

### 2) Отключение тяжелого canvas-эффекта на mobile/слабых устройствах
- Файл: `/home/itiro/dev/madmask/app/javascript/controllers/cursor_smoke_controller.js`
- Добавлен `shouldDisableForDevice()`:
  - отключает эффект при `pointer: coarse`;
  - отключает эффект при `hardwareConcurrency <= 4` или `deviceMemory <= 4`.

Ожидаемый эффект: меньше main-thread/GPU нагрузки, лучше отзывчивость на mobile.

### 3) Поджатие LCP-цепочки hero
- Файл: `/home/itiro/dev/madmask/app/views/pages/home.html.erb`
- Добавлен preload для hero WebP (`rel=preload as=image` + `imagesrcset/imagesizes`).
- Для PNG fallback:
  - `src` переведен с `site-hero.png` на `site-hero-640.png`;
  - убран `1920w` из PNG `srcset` (оставлены `640w` и `1280w`).

Ожидаемый эффект: меньше риск загрузки тяжелого fallback на узких экранах.

### 4) Упрощен critical path шрифтов
- Файл: `/home/itiro/dev/madmask/app/assets/stylesheets/00_fonts.css`
- Удален `@font-face` для `Anton` (OTF/TTF), который не используется текущими токенами.
- `font-display: swap` для Cascadia сохранен.

Ожидаемый эффект: меньше лишних font-правил/кандидатов в критическом пути.

## Замеры: до / после

Стенд:
- локально в Docker (`docker compose up -d web tailwind`)
- URL: `http://127.0.0.1:3000`
- окружение: development

### A) `bin/load_test_latencies` для `/` (120 samples)
- До:
  - `p50=0.258787s`
  - `p95=1.909743s`
  - `p99=2.017941s`
- После:
  - `p50=0.071048s`
  - `p95=0.085343s`
  - `p99=0.116141s`

### B) TTFB по `curl` (20 samples)
- До:
  - `ttfb_avg=0.2175s`
  - `ttfb_p50=0.2169s`
  - `ttfb_p95=0.2425s`
- После:
  - `ttfb_avg=0.0842s`
  - `ttfb_p50=0.0783s`
  - `ttfb_p95=0.1043s`

### C) `bin/load_test_ab` (одинаковые параметры)
Параметры:
- `AB_N=300 AB_C=10`
- `AB_N_HEAVY=1200 AB_C_HEAVY=25`

`GET /`:
- До:
  - `Requests per second: 2.85`
  - `Time per request: 3513.088 ms`
  - `p95: 11504 ms`
- После:
  - `Requests per second: 11.42`
  - `Time per request: 875.511 ms`
  - `p95: 1003 ms`

`GET /products` heavy:
- До:
  - `Requests per second: 3.80`
  - `Time per request: 6582.731 ms`
  - `p95: 13145 ms`
- После:
  - `Requests per second: 6.78`
  - `Time per request: 3686.760 ms`
  - `p95: 4181 ms`

Результаты `ab`:
- baseline: `/app/tmp/load_test_results/20260414_080732`
- post-change: `/app/tmp/load_test_results/20260414_082020`

## Размеры ключевых ассетов (контекст)
- `app/assets/builds/tailwind.css`: ~72 KB
- `app/javascript/controllers/cursor_smoke_controller.js`: ~18 KB
- `public/images/site-hero.png`: ~2.0 MB
- `public/images/site-hero-640.png`: ~999 KB
- `public/images/site-hero-640.webp`: ~115 KB

## Вывод
- Quick wins дали заметное ускорение серверного ответа и latency на главной.
- Самый вероятный вклад: предзагрузка attachments в `pages#home` + снижение клиентской нагрузки на mobile (`cursor_smoke`) + более безопасный LCP fallback.
- Для следующего этапа можно отдельно планировать браузерные Lighthouse/Web Vitals (LCP/INP/CLS) и более глубокую оптимизацию CSS/hero-изображений.
