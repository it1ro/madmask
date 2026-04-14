# Нагрузочное тестирование (Apache Bench) — эталонные URL и условия

Документ отражает реализацию плана нагрузочного тестирования для madmask (Rails 8, RU-only, без locale-префиксов в URL).

## Эталонные пути

| Сценарий | Метод и путь | Примечание |
|----------|----------------|------------|
| Главная | `GET /` | Корневой путь без редиректов по локали. |
| Каталог | `GET /products` | Опционально `?category=...` при фильтре. |
| Карточка товара | `GET /products/:id` | Подставьте существующий `id` (см. `bin/load_test_ab`). |
| Вход Devise | `POST /users/sign_in` | Не `/login`; нужны CSRF и поля `user[email]`, `user[password]`. |
| Сессия / корзина | `GET /cart` | Нагрузка на cookie-сессию без отдельного маршрута `/dashboard`. |
| Админка | `GET /admin` | Маршрут админки в текущей схеме URL. |

Базовый URL для скриптов: `http://127.0.0.1:3000` (переменная `BASE_URL`).

## Production: HTTP для ab и `force_ssl`

В `RAILS_ENV=production` по умолчанию включены `force_ssl` и проверка `hosts`, из‑за чего `ab` на `http://127.0.0.1` получает редирект или `403 Blocked host`.

**Локальный нагрузочный прогон без HTTPS** (только стенд, не публичный сервер):

```bash
export LOAD_TEST_ALLOW_HTTP=true
export APP_HOST=localhost:3000
bin/rails server -e production -b 0.0.0.0 -p 3000
```

При `LOAD_TEST_ALLOW_HTTP=true` в [`config/environments/production.rb`](../config/environments/production.rb) отключаются принудительный HTTPS и добавляются `127.0.0.1` / `localhost` в `config.hosts`. **Не задавайте эту переменную** в Kamal/продакшен-секретах.

Альтернатива: нагрузочный тест в `development` или прогон через reverse proxy с TLS.

## Автоматизация

- [`bin/load_test_ab`](../bin/load_test_ab) — сценарии `ab`, снимки `storage/*.sqlite3`, POST входа через временный postfile.
- [`bin/load_test_latencies`](../bin/load_test_latencies) — приближение p50/p95/p99 через повторные `curl` (переменные `URL_PATH`, `SAMPLES`; ab перцентили не отдаёт).

### Переменные для входа (POST)

```bash
export LOAD_TEST_USER_EMAIL=user@example.com
export LOAD_TEST_USER_PASSWORD=secret
```

Пользователь должен существовать в БД выбранного окружения.

### Docker

Команды приложения — по правилам проекта. В dev-образе (`Dockerfile.dev`) уже установлен пакет `apache2-utils` (`ab`).

```bash
docker compose build web   # после обновления Dockerfile.dev
docker compose run --rm web bash -lc 'bin/load_test_ab'
```

## Оптимизации из плана (вне скриптов)

- **SQLite busy timeout**: `SQLITE_BUSY_TIMEOUT_MS` — в [`config/database.yml`](../config/database.yml) и [`config/initializers/sqlite_wal.rb`](../config/initializers/sqlite_wal.rb).
- **Puma**: `RAILS_MAX_THREADS`, опционально `WEB_CONCURRENCY`, `PUMA_WORKER_TIMEOUT` — [`config/puma.rb`](../config/puma.rb).
- **COUNT каталога**: кэш `Rails.cache` на 2 минуты — [`app/controllers/products_controller.rb`](../app/controllers/products_controller.rb).
- **Сессии Devise в Solid Cache** (`session_store :cache_store`) — по необходимости отдельным изменением, не включено по умолчанию.

## Чек-лист после тюнинга

1. Повторить `bin/load_test_ab` с теми же `-n` / `-c`.
2. Сравнить RPS, `Time per request`, `Failed requests`, размеры `storage/*.sqlite3`.
3. Проверить логи на `SQLite3::BusyException` и 5xx.
4. При изменении Solid Queue — сравнить хвост очереди (SQL по `solid_queue_jobs` или `bin/rails runner`).
