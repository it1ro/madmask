# Итерация 6: дизайн и анимации (IMPLEMENTATION_PLAN)

## Статус

| Подзадача | Результат |
|-----------|-----------|
| 6.1 — CSS-переменные цветов | `app/assets/stylesheets/0_madmask_design_tokens.css` (`:root`); подключено в `app/assets/stylesheets/application.tailwind.css` (п. плана) и импортируется в `app/assets/tailwind/application.css` перед `@import "tailwindcss"` |
| Токены + Tailwind v4 `@theme` | В `app/assets/tailwind/application.css`: `@theme` мапит семантические утилиты (`font-heading`, `font-ui`, `text-ink`, `bg-card`, `border-line`, `shadow-glow` / `shadow-card`, и т.д.) поверх CSS-переменных из `0_madmask_design_tokens.css` |
| Полировка публичных вьюх | Каталог, карточка товара, show (ключевые блоки), header/footer переведены на утилиты темы; hover карточки: подъём 6px + комбинированная тень (внешнее свечение + лёгкий inset) |
| Главная — секция товаров | `PagesController#home`: `@featured_products = Product.order(created_at: :desc).limit(4)`; блок «Новинки» с `render "products/product"` и CTA «Весь каталог» (если есть товары) |
| Fade-in при навигации | Stimulus `page_transition_controller.js` + классы `.page-main` / `.page-main--visible` на `<main>`; `turbo:load` + `turbo:before-cache`; `prefers-reduced-motion: reduce` — без сдвига, контент видим без анимации |
| Админка | Формы, списки, new/edit — `border-line`, `bg-card` / `bg-panel`, кнопки с `font-ui`, фокус `outline-glow` |
| WebGL спиннер | Уже был (`.webgl-preview__*`); без изменений по сути |
| Курсор-дым (landing `/`) | Реализован: overlay `canvas` + particles через Stimulus `cursor_smoke_controller`, добавлены гравитация и искры при резком торможении (по deceleration), `prefers-reduced-motion` отключает эффект; исправлена вёрстка слоёв (canvas ниже шапки/hero) |
| One-shot canvas-вспышка на hero CTA | Добавлена: при первом `mouseenter` для CTA «В каталог», эффект только один раз на вкладку (через `sessionStorage`), поверх шапки (отдельный временный canvas) |

## Связанная работа (другая тема)

Реализация **галереи изображений** (модель, админка, lightbox) ведётся отдельно и не отменяет пункты дизайн-итерации выше; при необходимости см. историю коммитов / `IMPLEMENTATION_PLAN` по галерее.

## Команды проверки

```bash
docker compose run --rm web bin/rails tailwindcss:build
docker compose run --rm web bin/rails test
```

Визуально: главная (hero, новинки при наличии товаров, категории), каталог, карточка товара, админка.
