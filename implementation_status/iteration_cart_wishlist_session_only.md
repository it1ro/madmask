# Iteration: session-only cart & wishlist

## Status
- **Done**: Phase 1 / **1.1 Определить интерфейсы**

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
- Контракты добавлены как стабильная граница API; реализация storage/schema пойдёт следующим шагом (Phase 1 / 1.2+).
