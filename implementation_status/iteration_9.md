# Итерация 9: Типографика (Anton / Inter / Orbitron)

| Подзадача | Статус |
|-----------|--------|
| 9.1 Подключение Google Fonts (Inter/Orbitron), Anton — self-hosted | выполнено |
| 9.2 Заголовки на Anton + uppercase (h1–h3 + `font-heading` + ключевые секции) | выполнено |
| 9.3 Основной текст на Inter (line-height 1.5, веса 400/500/600/700) | выполнено |
| 9.4 Бейджи/фильтры/tech-акценты на Orbitron (через `font-ui`, с tracking) | выполнено |
| 9.5 Self-hosted Anton (`Anton-Regular.ttf` v2.3+) + `@font-face` | выполнено |

## Где менялось

- `app/views/layouts/application.html.erb` — Google Fonts без Anton (оставлены Inter/Orbitron).
- `app/assets/stylesheets/0_madmask_design_tokens.css` — добавлен `--font-anton`, уточнён fallback для Orbitron.
- `app/assets/tailwind/application.css` — `--font-heading` → Anton, uppercase для заголовков, Inter line-height/weight, Orbitron letter-spacing.
- `app/assets/stylesheets/00_fonts.css` — `@font-face` для локального Anton (`app/assets/fonts/anton/Anton.otf` + fallback `Anton-Regular.ttf`).

