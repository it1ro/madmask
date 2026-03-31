# Итерация 8: Docker для продакшена и Kamal (статус)

| Подзадача | Статус |
|-----------|--------|
| 8.1 Production Dockerfile (multi-stage + assets precompile) | выполнено |
| 8.2 `.dockerignore` | не начато |
| 8.3 Установка Kamal | уже есть в проекте |
| 8.4 `kamal init` | уже есть в проекте |
| 8.5 Правки `config/deploy.yml` | уже есть в проекте (требует конкретизации под сервер) |
| 8.6 Подготовка сервера (Docker/SSH) | не начато |
| 8.7 `kamal setup` | не начато |
| 8.8 `kamal deploy` | не начато |

## Сделано в 8.1

- Добавлен production `Dockerfile` (root) в многоступенчатом формате:
  - build stage: `bundle install`, `bootsnap precompile`, `rails assets:precompile`;
  - runtime stage: только runtime-зависимости (sqlite, vips), запуск `bin/rails server`.
- Сохранён dev-образ в `Dockerfile.dev`, `docker-compose.yml` переключён на него.

