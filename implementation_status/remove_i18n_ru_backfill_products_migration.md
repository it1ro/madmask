## Что сделано

- Добавлена миграция `db/migrate/20260414120000_backfill_products_from_ru_translations.rb`.
- Миграция переносит `translations(locale = 'ru')` в `products.name` и `products.description` только если в `products` значение:
  - пустое (blank),
  - либо равно legacy-маркерам (`MyString` для `name`, `MyText` для `description`).
- Непустые и не-legacy значения в `products` не перезаписываются, чтобы исключить потерю данных существующих товаров.
- Добавлена миграция `db/migrate/20260414121000_drop_translations.rb` для удаления таблицы `translations` после backfill.
- Модель `Product` переведена на прямые валидации `name`/`description` (без зависимости от `Translatable`/`Translation`).
- Удалены артефакты переводного слоя:
  - `app/models/translation.rb`
  - `app/models/concerns/translatable.rb`

## Проверка целостности данных

- Логика обновления точечная и идемпотентная для целевых полей:
  - `name` обновляется только при выполнении условия `should_replace?`.
  - `description` обновляется только при выполнении условия `should_replace?`.
- Если у RU-перевода поле пустое, оно не записывается в `products`.
- `down` оставлен `no-op`, так как безопасно восстановить прежние legacy/пустые значения невозможно без отдельного снапшота.

## Что проверить после запуска миграции

- Количество товаров, где `products.name/description` были пустыми/legacy до миграции и стали заполнены RU-значениями.
- Отсутствие изменений у товаров с уже валидными значениями в `products`.
- Отсутствие таблицы `translations` в `db/schema.rb` после `db:migrate`.

## Продолжение (RU-only рефакторинг, этап 2+3+4)

- Убран locale-scoped роутинг (`scope "(:locale)"`) в `config/routes.rb`.
- Добавлены постоянные редиректы `301` со старых путей `/ru/...` на безлокальные URL.
- Удалены `set_locale` и `default_url_options` из `ApplicationController`.
- Админка переведена на прямые поля `product[name]`/`product[description]`:
  - `app/controllers/admin/products_controller.rb`
  - `app/views/admin/products/_form.html.erb`
- Все рабочие вызовы `translated_name`/`translated_description` заменены на `name`/`description` во вьюхах/хелперах/контроллерах.
- Удалены EN-локали:
  - `config/locales/en.yml`
  - `config/locales/devise.en.yml`
- Удалена устаревшая фикстура `test/fixtures/translations.yml` после удаления таблицы `translations`.

## Проверка

- Запущен тест-ран в контейнере: `docker compose run --rm web bin/rails test`.
- Результат: `23 runs, 64 assertions, 0 failures, 0 errors, 0 skips`.
