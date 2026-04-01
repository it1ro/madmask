## Problem
В блоке `product_card_actions_<id>` появился горизонтальный скроллинг, который не нужен.

## Root cause
В партиале `app/views/products/_actions.html.erb` на контейнере экшенов был класс `overflow-x-auto`, который включал горизонтальную прокрутку при любом небольшом переполнении по ширине.

## Fix
- Заменено поведение контейнера на перенос строк: `flex-nowrap overflow-x-auto` → `flex-wrap overflow-x-hidden`.

## Files changed
- `app/views/products/_actions.html.erb`

