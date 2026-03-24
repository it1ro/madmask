# Итерация 0: Docker (статус)

| Подзадача | Статус |
|-----------|--------|
| 0.1 Dockerfile (Ruby 3.2-slim, SQLite, Bundler) | выполнено |
| 0.2 docker-compose.yml: `web`, `.:/app`, том `bundle_cache` → `/usr/local/bundle`, порт 3000 | выполнено |
| 0.3 Переменные окружения разработки | выполнено |
| 0.4 entrypoint.sh (БД при старте) | выполнено |
| 0.5 Проверка Ruby/Rails в контейнере | выполнено |

## Проверка 0.5 (локально)

После `docker compose build web`:

```bash
docker compose run --rm web ruby -v
docker compose run --rm web bundle -v
docker compose run --rm web rails -v
```

Ожидается: Ruby 3.2.x, Bundler 2.x, Rails **8.1.3** (версия зафиксирована в `Dockerfile`).
