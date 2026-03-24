# Итерация 1: Rails-приложение (статус)

| Подзадача | Статус |
|-----------|--------|
| 1.1 `rails new . -d sqlite3 -c tailwind --skip-jbuilder` | выполнено |
| 1.2 `config/database.yml` для SQLite | выполнено — шаблон Rails 8 для SQLite без изменений (`storage/*.sqlite3`, production multi-db) |
| 1.3 Gemfile / `bundle install` | выполнено генератором |
| 1.4 Запуск `rails server -b 0.0.0.0` | проверить локально / в Docker |
| 1.5 Коммит | по желанию |

## Подзадача 1.1 (фактическая команда)

Из-за недоступности сборки Docker в среде выполнения генерация выполнена **локально** с сохранением кастомного Docker-окружения:

```bash
rails new . -d sqlite3 -c tailwind --skip-jbuilder --skip-docker --force
```

Флаг `--skip-docker` нужен, чтобы не перезаписать существующие `Dockerfile`, `docker-compose.yml` и `entrypoint.sh` из итерации 0.

После генерации: `bin/rails db:prepare` (успешно).

**Примечание:** `.ruby-version` указывает на Ruby с хоста генератора (`ruby-3.3.10`). Образ разработки в `Dockerfile` — `ruby:3.2-slim`; при работе только через контейнер имеет смысл выровнять версию Ruby под образ.

## Подзадача 1.2

`config/database.yml` — стандарт для SQLite после `rails new -d sqlite3`: `adapter: sqlite3`, `development` / `test` указывают на `storage/development.sqlite3` и `storage/test.sqlite3`, в `production` — primary + cache/queue/cable в `storage/`. Дополнительная правка не требуется; файлы БД игнорируются через `.gitignore` (`/storage/*` с исключением `.keep`).
