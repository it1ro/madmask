## Что сделано

- Добавлены **полиморфные переводы** для динамического контента через таблицу `translations`.
- Для `Product` тексты (`name`, `description`) теперь берутся из переводов:
  - `Product#translated_name`
  - `Product#translated_description`
- Админ-форма товара обновлена: редактирование **RU + EN** в одном экране (nested attributes).
- Выполнен backfill RU-переводов из существующих колонок `products.name` / `products.description`.

## Технические детали

- **Таблица**: `translations`
  - `translatable_type`, `translatable_id` (polymorphic)
  - `locale` (NOT NULL)
  - `name`, `description`
  - уникальный индекс: `(translatable_type, translatable_id, locale)`
- **Модель**: `Translation` с валидацией `locale` (presence + inclusion).
- **Модель**: `Product`
  - `has_many :translations, as: :translatable`
  - `accepts_nested_attributes_for :translations` с `reject_if` (не сохранять пустые переводы)
  - валидация наличия названия на языке по умолчанию (RU) (с временным fallback на legacy-колонку `products.name`).

## Миграции

- `20260401094152_create_translations.rb` — создание таблицы
- `20260401094211_backfill_translations_for_products_ru.rb` — перенос текущих `products.name/description` в RU-перевод
- `20260401094236_add_constraints_to_translations.rb` — `locale NOT NULL` + уникальный индекс

## Чеклист проверки

- Открыть `/ru/products/:id` и `/en/products/:id` — меняются `translated_name/translated_description` (если EN заполнен).
- В админке создать товар с заполненным RU и пустым EN — сохраняется корректно, EN-перевод не создаётся.
- В админке отредактировать товар, добавить EN-перевод — сохраняется и отображается на `/en/...`.
- Проверить, что ссылки остаются в текущей локали (через `default_url_options` в `ApplicationController`).

## Дальше (для статей)

Для `Article` (и любых других сущностей) можно переиспользовать ту же таблицу `translations` через `has_many :translations, as: :translatable` и методы `translated_*` (или вынести общий concern).
