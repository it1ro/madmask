# Итерация 7: UI/UX товара по аудиту (CTA, галерея, 3D, a11y)

## Статус

| Подзадача | Результат |
|-----------|-----------|
| 7.1 Адаптивность и touch | `webgl_preview_controller.js`: ограничение `renderer.setPixelRatio` до `1` на устройствах с primary touch/coarse pointer, сохранён лимит `2` для desktop; для `OrbitControls` на touch включена схема `ONE: ROTATE`, `TWO: DOLLY_ROTATE`, отключен pan для предотвращения конфликтов со скроллом |
| Lightbox поверх шапки | `app/views/products/show.html.erb`: `product-gallery-lightbox` поднят до `z-[1000]`, фон усилен до `rgba(2,1,6,0.97)` + `backdrop-blur-md`; кнопка закрытия получила более контрастный фон/обводку и `z-30` для гарантированной видимости |
| CTA «Связаться» | `product_contact_mailto_url` + `madmask_contact_email` (ENV → credentials); кнопка/ disabled + подсказка; стили `.product-cta`, `.cta-pulse-shadow` в `application.css` |
| Конфиг | `config.x.contact_email` в `application.rb` (опционально, дублирует ENV) |
| Каталог | `alt: product.name`; `active:` на ссылках; `aria-label` на ссылке 3D |
| Главное фото | `srcset`/`sizes` 800w/1200w; миниатюры: `data-thumb-main-url`, `data-thumb-srcset`, aria «Выбрать кадр N»; контейнер на всю ширину карточки, `img` `absolute inset-0 object-cover` — без пустых полей в рамке 4:3 |
| Много миниатюр | Левая колонка и обёртка галереи — `min-w-0`; ряд — `flex-1 min-w-0` + `overscroll-x-contain`; кнопки ‹ › по видимости прокрутки; крупный hit-area; по клику на миниатюру — если сосед слева/справа не полностью в полосе, `scrollBy` на шаг «миниатюра+gap» (`maybeScrollStripForNeighborVisibility`) |
| Галерея JS | `product_gallery_controller.js` — миниатюры → главный кадр; lightbox по клику на главное фото (вариант до 2400px), стрелки (крупные hit-target) и клавиши ←/→, клик по увеличенному фото — следующий кадр; Escape и фон — закрытие; `data-product-gallery-slides-value` через `tag.div` |
| Индикатор фото | В галерее показывается `N / total` в карточном режиме (над главным кадром) и в lightbox (сверху слева), обновляется при перелистывании |
| WebGL | Оверлей спиннер + прогресс (`loader.load` onProgress); скрытие по готовности/fallback; панель ошибки + «Повторить»; `role="figure"` + `sr-only` описание рядом с `#canvas-container` |
| Правая колонка | `reveal-on-scroll` + `.product-show-info` / `--revealed` |

## Команды проверки

```bash
docker compose run --rm web bin/rails test
```

Ручная проверка: `/products`, `/products/:id`, сценарии 3D (загрузка / ошибка / повтор).
