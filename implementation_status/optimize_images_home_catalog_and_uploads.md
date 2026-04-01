## Цель
- Уменьшить трафик изображений на главной и в каталоге.
- Добавить предсжатие изображений, загружаемых в `Product` (cover + gallery), с минимальной потерей качества.

## Главная страница (hero)
- Hero теперь отдаётся через `picture` с источниками AVIF/WebP и PNG fallback.
- Ожидаемые файлы в `public/images/` (генерируются внешним инструментом и могут жить вне git, если так устроен деплой):
  - `site-hero-640.(avif|webp|png)`
  - `site-hero-1280.(avif|webp|png)`
  - `site-hero-1920.(avif|webp|png)`
  - fallback: `site-hero.png`

Файл: `app/views/pages/home.html.erb`.

## Каталог (карточки)
- Карточка товара использует `srcset/sizes` и деривативы 256/512 вместо одного 512.
- Источник изображения теперь берётся через `Product#hero_image`: сначала оптимизированная обложка, затем оригинальная, затем первая оптимизированная картинка галереи/оригинальная.

Файл: `app/views/products/_product.html.erb`, логика выбора в `app/models/product.rb`.

## Предсжатие при загрузке (admin)
### Как работает
- Добавлены attachments:
  - `cover_image_optimized`
  - `gallery_images_optimized`
- После create/update в админке, если трогались `cover_image` или `gallery_images` (или удалялись кадры галереи), ставится job `Products::OptimizeImagesJob`.
- Job создаёт WebP-версии (ресайз до `max 2000px`, `quality 82`, `strip: true`) и прикрепляет их как `*_optimized`.
- В metadata оптимизированного blob сохраняется `source_checksum`, чтобы не пересоздавать оптимизацию без необходимости.

Файлы:
- `app/jobs/products/optimize_images_job.rb`
- `app/services/products/image_optimizer.rb`
- `app/controllers/admin/products_controller.rb`

### Почему WebP (а не сразу AVIF)
- WebP стабильно поддерживается браузерами и чаще “просто работает” в окружениях libvips по умолчанию.
- AVIF на витрину можно добавлять следующей итерацией (потребует уверенной поддержки `libheif`/энкодера в образе и тестов).

## Docker / libvips
- В dev/prod Docker образ добавлены библиотеки для кодеков WebP/AVIF:
  - runtime: `libwebp7`, `libheif1`
  - build: `libwebp-dev`, `libheif-dev`

Файлы: `Dockerfile`, `Dockerfile.dev`.

## Проверка
- Главная: открыть DevTools → Network → проверить `content-type` и размер загружаемого hero-арта (AVIF/WebP если файлы присутствуют).
- Каталог: убедиться, что запрашиваются 256/512 variants, а не большой оригинал.
- Админка: загрузить большие изображения (несколько MB) и проверить, что создались `cover_image_optimized`/`gallery_images_optimized`, и витрина использует их.

