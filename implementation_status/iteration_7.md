# Итерация 7: UI/UX товара по аудиту (CTA, галерея, 3D, a11y)

## Статус

| Подзадача | Результат |
|-----------|-----------|
| CTA «Связаться» | `product_contact_mailto_url` + `madmask_contact_email` (ENV → credentials); кнопка/ disabled + подсказка; стили `.product-cta`, `.cta-pulse-shadow` в `application.css` |
| Конфиг | `config.x.contact_email` в `application.rb` (опционально, дублирует ENV) |
| Каталог | `alt: product.name`; `active:` на ссылках; `aria-label` на ссылке 3D |
| Главное фото | `srcset`/`sizes` 800w/1200w; миниатюры: `data-thumb-main-url`, `data-thumb-srcset`, aria «Выбрать кадр N»; контейнер на всю ширину карточки, `img` `absolute inset-0 object-cover` — без пустых полей в рамке 4:3 |
| Галерея JS | `product_gallery_controller.js` — миниатюры → главный кадр; lightbox по клику на главное фото (вариант до 2400px), стрелки (крупные hit-target) и клавиши ←/→, клик по увеличенному фото — следующий кадр; Escape и фон — закрытие; `data-product-gallery-slides-value` через `tag.div` |
| WebGL | Оверлей спиннер + прогресс (`loader.load` onProgress); скрытие по готовности/fallback; панель ошибки + «Повторить»; `role="figure"` + `sr-only` описание рядом с `#canvas-container` |
| Правая колонка | `reveal-on-scroll` + `.product-show-info` / `--revealed` |

## Команды проверки

```bash
docker compose run --rm web bin/rails test
```

Ручная проверка: `/products`, `/products/:id`, сценарии 3D (загрузка / ошибка / повтор).
