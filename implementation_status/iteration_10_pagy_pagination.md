## Итерация 10: Пагинация (Pagy)

| Подзадача | Статус |
|-----------|--------|
| 10.1 Добавить `pagy` в Gemfile и установить зависимости | выполнено |
| 10.2 Подключить `Pagy::Backend`/`Pagy::Frontend` | выполнено |
| 10.3 Настроить Tailwind extra и дефолтные параметры | выполнено |
| 10.4 Интегрировать пагинацию в публичный каталог | выполнено |
| 10.5 Интегрировать пагинацию в админский список товаров | выполнено |

## Где менялось

- `Gemfile` — добавлен `pagy`.
- `app/controllers/application_controller.rb` — `include Pagy::Backend`.
- `app/controllers/application_controller.rb` — `include Pagy::Method`.
- `app/helpers/application_helper.rb` — `include Pagy::Method` + `Pagy::NumericHelpers`.
- `app/controllers/products_controller.rb` — `pagy(...)` в `index` (конфиг `items/size` в вызове).
- `app/controllers/admin/products_controller.rb` — `pagy(...)` в `index` (конфиг `items/size` в вызове).
- `app/views/products/index.html.erb` — добавлен `@pagy.series_nav`.
- `app/views/admin/products/index.html.erb` — добавлен `@pagy.series_nav`.

