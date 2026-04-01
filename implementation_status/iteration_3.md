# Итерация 3: Модель Product и CRUD — статус

| Элемент | Статус |
|---------|--------|
| [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) — итерация 3 | в работе |

| 3.1 Модель `Product`: поля `name`, `description`, `price`, `category`; обложка — `has_one_attached :cover_image`; 3D — `has_one_attached :model_file` (колонка `model_url` позже удалена — см. миграции); миграции Active Storage | выполнено |
| 3.2 Миграция и применение | частично: `create_products` + `create_active_storage_tables` применены в dev |
| 3.3 REST CRUD + Turbo Frames/Streams | выполнено (проверено) |
| 3.4 Маршруты: публично `resources :products, only: [:index, :show]`; CRUD в `namespace :admin` (`/admin`, `Admin::ProductsController`) | выполнено |
| 3.5 Простая админ-панель: `/admin`, Turbo Frames/Streams для товаров, без аутентификации (позже) | выполнено |
| 3.6 Протестировать CRUD в браузере | не начато |

## Примечание по фактической реализации 3.3
- CRUD реализован в `Admin::ProductsController` (RESTful `index/new/create/edit/update/destroy`) и во вьюхах `app/views/admin/products/*`.
- Turbo Streams: `create.turbo_stream.erb` (prepend + reset формы), `destroy.turbo_stream.erb` (remove), `update.turbo_stream.erb` (replace).
- Turbo Frames: редактирование товара открывается в frame `dom_id(product)` (ссылка «Редактировать» в `_product.html.erb`), `edit.html.erb` рендерит форму внутри `turbo_frame_tag dom_id(@product)`.
- Публичный `ProductsController` ограничен `index/show` по архитектуре проекта (см. 3.4), а не является полным scaffold CRUD.
