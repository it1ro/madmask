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
- `app/views/shared/_footer.html.erb` — в футере заменены ссылки на Instagram/X на VK.
- `app/assets/stylesheets/0_madmask_design_tokens.css` — добавлен `--font-anton`, уточнён fallback для Orbitron.
- `app/assets/tailwind/application.css` — `--font-heading` → Anton, uppercase для заголовков, Inter line-height/weight, Orbitron letter-spacing.
- `app/assets/stylesheets/00_fonts.css` — `@font-face` для локального Anton (`app/assets/fonts/anton/Anton.otf` + fallback `Anton-Regular.ttf`).

## Обновление: единый шрифт Cascadia Code

- `app/views/layouts/application.html.erb` — убраны подключения Google Fonts (Inter/Orbitron).
- `app/assets/stylesheets/00_fonts.css` — добавлен self-hosted `@font-face` для Cascadia Code (latin/cyrillic, normal/italic).
- `app/assets/stylesheets/0_madmask_design_tokens.css` — все `--font-*` сведены к единому стеку Cascadia Code.

## Примечание по плану

- В актуальном `IMPLEMENTATION_PLAN.md` «Итерация 9» соответствует типографике; бэкапы SQLite и мониторинг вынесены в «Итерацию 9.5» (опционально).

