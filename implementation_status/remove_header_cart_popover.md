## Что было
- При наведении на ссылку корзины в хедере появлялся popover (мини-содержимое корзины).
- Popover рендерился через `app/views/cart/_popover.html.erb` и показывался из `shared/_cart_button.html.erb` + мобильного блока `<details>` в `shared/_header.html.erb`.

## Что сделано
- Popover корзины удалён из хедера (desktop hover/focus и mobile `<details>`).
- Удалён Stimulus-контроллер `cart-popover`.
- Удалены Turbo Stream обновления `cart_popover`.

## Файлы
- Updated: `app/views/shared/_header.html.erb`
- Updated: `app/views/shared/_cart_button.html.erb`
- Updated: `app/views/cart/add.turbo_stream.erb`
- Updated: `app/views/cart/remove.turbo_stream.erb`
- Updated: `app/views/cart/update.turbo_stream.erb`
- Deleted: `app/views/cart/_popover.html.erb`
- Deleted: `app/javascript/controllers/cart_popover_controller.js`

