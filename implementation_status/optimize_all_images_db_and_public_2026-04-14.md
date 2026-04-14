## Goal
- Optimize all product images (including existing records in DB via Active Storage) and public images.
- Keep quality conservative to avoid visible over-compression.

## Changes in code

### 1) Safer default quality for product optimization
- File: `app/services/products/image_optimizer.rb`
- `DEFAULT_WEBP_QUALITY` changed from `82` to `88`.
- Added `force:` flag to allow full re-optimization of already processed images.

### 2) Job supports forced re-optimization
- File: `app/jobs/products/optimize_images_job.rb`
- `perform(product_id, force: false)` now forwards `force:` to `Products::ImageOptimizer`.

### 3) Bulk optimizer script
- File: `bin/optimize_all_images`
- Performs two phases:
  1. Re-optimizes all product cover/gallery images from DB (`force: true`, quality 88, max dimension 2000).
  2. Scans `public/images/**/*.{png,jpg,jpeg}` and writes/updates `.webp` variants.
- Script does not replace an existing `.webp` if existing file is smaller or equal.

## Execution
- Run inside container:
  - `docker compose exec web bash -lc 'ruby bin/optimize_all_images'`

## Actual run result (2026-04-14)
- Product images in DB: optimized for 80 products.
- Public images:
  - updated/created:
    - `public/images/madmask-label.webp`
    - `public/images/madmask-logo.webp`
    - `public/images/site-hero-unused.webp`
    - `public/images/site-hero.webp`
  - skipped (existing WebP already smaller/equal):
    - `public/images/madmask-image.webp`
    - `public/images/site-hero-640.webp`
    - `public/images/site-hero-1280.webp`
    - `public/images/site-hero-1920.webp`

## Notes
- This update intentionally prioritizes visual quality (`quality=88`) and avoids aggressive compression.
- For future bulk run:
  - `WEBP_QUALITY=88 MAX_DIMENSION=2000 ruby bin/optimize_all_images`
