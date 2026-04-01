# Iteration: session-only cart & wishlist

## Status
- **Done**: Phase 1 / **1.1 Определить интерфейсы**
- **Done**: Phase 1 / **1.2 Session storage schema**

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
- Инварианты:
  - `product_id` нормализуется в `String` (blank → noop)
  - `qty` всегда integer; `qty <= 0` трактуется как удаление позиции
  - Контракты возвращают структуры данных без AR:
    - `CartContract#list` → массив `{ product_id:, qty: }`
    - `WishlistContract#list` → массив `product_id` (строки)
