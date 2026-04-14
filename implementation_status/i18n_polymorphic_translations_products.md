## Архив: i18n polymorphic translations (устарело)

Этот документ описывает исторический этап с полиморфными переводами `translations`.

Состояние на текущий момент:

- мультиязычность удалена;
- приложение работает в RU-only режиме;
- таблица `translations` удалена;
- `Product` использует прямые поля `name` и `description`;
- `translated_*`, `Translation`, `Translatable` удалены из рабочего кода.

Актуальный статус и шаги миграции зафиксированы в:

- `implementation_status/remove_i18n_ru_backfill_products_migration.md`
