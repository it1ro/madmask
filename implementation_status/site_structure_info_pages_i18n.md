# Site structure: info pages + RU/EN locales (2026-04-01)

## Goal

- Add "support" informational pages to strengthen trust (E‑E‑A‑T) and make them available in **Russian and English**.

## What changed (in code)

- **I18n base setup**
  - `config/application.rb`
    - Set `available_locales` to `ru/en`
    - Set `default_locale` to `ru`
  - `app/controllers/application_controller.rb`
    - Locale is taken from `/:locale` in the URL
    - All URL helpers include the current locale via `default_url_options`

- **Routes**
  - `config/routes.rb`
    - All public routes are now scoped under `/:locale` (`/ru/...`, `/en/...`)
    - Added "backward-compatible" redirects for old non-localized URLs to the default locale.
    - `/` now redirects to `/<default-locale>` without overriding `root_path` helper.

- **New pages (RU/EN)**
  - Controller actions: `PagesController`
    - `about`, `delivery_payment`, `lead_times_custom`, `materials_care`, `faq`, `contacts`
  - Views:
    - `app/views/pages/about.html.erb`
    - `app/views/pages/delivery_payment.html.erb`
    - `app/views/pages/lead_times_custom.html.erb`
    - `app/views/pages/materials_care.html.erb`
    - `app/views/pages/faq.html.erb`
    - `app/views/pages/contacts.html.erb`
    - Shared layout for content: `app/views/pages/_info_page.html.erb`

- **Translations**
  - `config/locales/ru.yml` — added `pages.*` + basic navigation labels
  - `config/locales/en.yml` — added `pages.*` + basic navigation labels

- **Navigation**
  - `app/views/layouts/application.html.erb` — dynamic `<html lang="...">`, localized skip-link
  - `app/views/shared/_header.html.erb` — added "Info" menu + locale switcher (RU/EN)
  - `app/views/shared/_footer.html.erb` — added links to all new info pages

## Result (URLs)

- Russian:
  - `/ru/about`
  - `/ru/delivery-and-payment`
  - `/ru/lead-times-and-custom`
  - `/ru/materials-and-care`
  - `/ru/faq`
  - `/ru/contacts`

- English:
  - `/en/about`
  - `/en/delivery-and-payment`
  - `/en/lead-times-and-custom`
  - `/en/materials-and-care`
  - `/en/faq`
  - `/en/contacts`

