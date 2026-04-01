## Goal
Сделать так, чтобы подсказка “Добавить в корзину” появлялась сверху кнопки в блоке `product_card_actions_<id>`.

## Change
В `app/views/products/_actions.html.erb` у tooltip-элемента заменена привязка позиционирования:
- `top-full mt-2` (снизу) → `bottom-full mb-2` (сверху)

Также tooltip вынесен **вне** тега кнопки (соседним элементом внутри обёртки), чтобы он гарантированно появлялся над кнопкой и не перекрывал её кликабельную область.

## Files changed
- `app/views/products/_actions.html.erb`

