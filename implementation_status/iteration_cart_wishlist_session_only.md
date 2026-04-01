# Iteration: session-only cart & wishlist

## Status
- **Done**: Phase 1 / **1.1 Определить интерфейсы**
- **Done**: Phase 1 / **1.2 Session storage schema**
- **Done**: Phase 1 / **1.3 Где хранить контракты и как инжектить session**
- **Done**: Phase 1 / **1.4 Минимальные unit-tests контрактов**
- **Done**: Phase 2 / **2.1 Создать контроллеры** (`CartController`, `WishlistController`)
- **Done**: Phase 2 / **2.2 Экшены и контрактная граница** (валидация параметров, вызов контрактов, Turbo Stream vs HTML redirect fallback)
- **Done**: Phase 2 / **2.3 Turbo Stream ответ как “единый пакет UI-обновлений”** (turbo_stream templates обновляют header counters / popover / product actions / page containers)
- **Done**: Phase 3 / **3.1 Product card: добавить две CTA‑кнопки** (`products/_actions` + target `product_card_actions_<id>`, add-to-cart + wishlist toggle)
- **Done**: Phase 3 / **3.4 Страницы `/cart` и `/wishlist`** (`cart/show` + `cart/_page` с qty controls; `wishlist/show` + `wishlist/_page` с toggle)
- **Done**: Phase 4 / **4.1 Единые DOM targets** (`header_cart_counter`, `header_wishlist_counter`, `cart_popover`, `cart_page`, `product_card_actions_<id>`)

## Fixups (после первичной сборки)
- Turbo Stream мутации подготавливают page state (чтобы `cart/_page` и `wishlist/_page` рендерили названия/цены, а не только `#id`).
- Turbo Stream шаблоны передают в `products/_actions` корректный local `product:` (вместо несуществующего `product_id:`).

## Contracts API (фиксировано)

### `CartContract`
- `initialize(session:)`
- `add(product_id)`
- `remove(product_id)`
- `update(product_id, qty)`
- `list`

### `WishlistContract`
- `initialize(session:)`
- `toggle(product_id)`
- `list`

## Notes
- Session schema (фиксировано и реализовано в контрактах):
  - Cart: `session[:cart_items]` → Hash `{ "<product_id>" => qty_integer }`
  - Wishlist: `session[:wishlist_product_ids]` → Array of String IDs `["1", "2", ...]`
- Session injection pattern:
  - Контракты лежат в `app/contracts/*` и инициализируются через keyword-аргумент `session:`
  - Внутри используется мини-адаптер `SessionStore` (`app/contracts/session_store.rb`) как прослойка над `session` (чтобы проще менять ключи/формат и удобнее тестировать)
- Инварианты:
  - `product_id` нормализуется в `String` (blank → noop)
  - `qty` всегда integer; `qty <= 0` трактуется как удаление позиции
  - Контракты возвращают структуры данных без AR:
    - `CartContract#list` → массив `{ product_id:, qty: }`
    - `WishlistContract#list` → массив `product_id` (строки)
