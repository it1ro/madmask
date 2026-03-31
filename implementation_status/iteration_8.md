# Итерация 8: Docker для продакшена и Kamal (статус)

| Подзадача | Статус |
|-----------|--------|
| 8.1 Production Dockerfile (multi-stage + assets precompile) | выполнено |
| 8.2 `.dockerignore` | выполнено (проверено и уточнено) |
| 8.3 Установка Kamal | выполнено (gem в `Gemfile`, binstub `bin/kamal`) |
| 8.4 `kamal init` | выполнено (`config/deploy.yml`, `.kamal/` присутствуют) |
| 8.5 Правки `config/deploy.yml` | выполнено (сервер `77.105.168.30`, домен `madmask.ilmir.tech`) |
| 8.6 Подготовка сервера (Docker/SSH) | не начато |
| 8.7 `kamal setup` | не начато |
| 8.8 `kamal deploy` | не начато |

## Сделано в 8.1

- Добавлен production `Dockerfile` (root) в многоступенчатом формате:
  - build stage: `bundle install`, `bootsnap precompile`, `rails assets:precompile`;
  - runtime stage: только runtime-зависимости (sqlite, vips), запуск `bin/rails server`.
- Сохранён dev-образ в `Dockerfile.dev`, `docker-compose.yml` переключён на него.

## Уточнения в 8.2–8.4

- `.dockerignore` обновлён: добавлены `storage/` и SQLite-файлы из `db/`, убран слишком широкий игнор `*.md` (чтобы не выкидывать `README.md` из build context).
- Kamal подтверждён в проекте: `gem "kamal"` в `Gemfile`, версия присутствует в `Gemfile.lock`, binstub `bin/kamal` на месте.
- `kamal init` уже выполнен ранее: есть `config/deploy.yml` и `.kamal/`.

