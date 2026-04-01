## Контекст

В шапке сайта счётчик у кнопки избранного отображался иначе, чем у корзины: был встроен в поток (рядом с иконкой), из-за чего визуально и по DOM-структуре отличался от углового бейджа корзины.

## Что сделано

- Привёл `shared/_wishlist_button.html.erb` к той же структуре, что и `shared/_cart_button.html.erb`:
  - ссылка осталась кнопкой,
  - счётчик вынесен в отдельный блок и позиционируется абсолютно (`absolute -right-2 -top-2`) как угловой бейдж.
- Выравнял стили бейджа избранного под корзину в `shared/_wishlist_counter.html.erb` (фон `bg-accent-deep`).
- Сделал скрытие бейджа при нулевом количестве:
  - `shared/_cart_counter.html.erb` и `shared/_wishlist_counter.html.erb` теперь рендерят бейдж **только если `count > 0`**,
  - `id` оставлен на пустой обёртке (`div#header_*_counter`) без размеров, чтобы Turbo Stream `replace` работал и при нуле.
- DOM target для Turbo Stream обновления (`id="header_wishlist_counter"`) сохранён, `wishlist/toggle.turbo_stream.erb` продолжает работать без изменений.

## Файлы

- `app/views/shared/_wishlist_button.html.erb`
- `app/views/shared/_wishlist_counter.html.erb`
- `app/views/shared/_cart_counter.html.erb`
- `implementation_status/fix_header_wishlist_counter_badge_like_cart.md`

## Проверка

- Открыть любую страницу с хедером на desktop:
  - убедиться, что счётчик избранного — угловой бейдж как у корзины;
  - нажать “в избранное” на товаре и проверить, что счётчик обновляется через Turbo без перезагрузки.

