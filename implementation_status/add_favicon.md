## Goal

Generate and integrate a proper favicon set for the Madmask Rails app.

## Changes

- Updated `public/icon.svg` to a high-contrast mask-style icon.
- Generated raster assets from the SVG:
  - `public/icon.png` (512x512)
  - `public/apple-touch-icon.png` (180x180)
  - `public/favicon-32x32.png`
  - `public/favicon-16x16.png`
  - `public/favicon.ico` (multi-size)
- Updated `<head>` tags in `app/views/layouts/application.html.erb` to reference the new favicon assets and set `theme-color`.
- Added `public/site.webmanifest` and linked it from the layout (static manifest; does not require routes).

## Notes

- A dynamic manifest exists at `app/views/pwa/manifest.json.erb`, but the route is currently commented out in `config/routes.rb`. This implementation uses a static `public/site.webmanifest` instead.
