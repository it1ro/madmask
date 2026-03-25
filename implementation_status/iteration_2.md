# Итерация 2: Hotwire и Tailwind (статус)

| Подзадача | Статус |
|-----------|--------|
| 2.1 Gemfile: `hotwire-rails`, `turbo-rails`, `stimulus-rails` | выполнено |
| 2.2 Установка Hotwire (`hotwire:install` или эквивалент) | выполнено |
| 2.3 Tailwind: `tailwindcss-rails`, сборка, файл стилей | выполнено |
| 2.4 Фоновая сборка Tailwind (`tailwindcss:watch` / Procfile) | выполнено |
| 2.5 Сервис `tailwind` в `docker-compose.yml` (`tailwindcss:watch`) | выполнено |
| 2.6 Проверка: приложение открывается со стилями Tailwind | выполнено |
| 2.7 Makefile с релевантными командами | выполнено |

## Подзадача 2.7

**Цель:** единая точка входа для типичных команд без ручного набора `docker compose run --rm web …`.

**Сделано:** в корне репозитория добавлен `Makefile`:

- запуск стека: `make up`, `make up-d`, `make down`, `make build`, `make logs`;
- оболочка: `make bash`, `make exec-bash` (когда `web` уже поднят);
- Rails: `make console`, `make routes`, `make test`, `make lint`, `make setup`, `make ci`, произвольные задачи — `make rails ARGS="db:migrate"`;
- БД: `db-prepare`, `db-migrate`, `db-rollback`, `db-seed`, `db-reset`;
- Tailwind: `tailwind-build`, `tailwind-watch` (сервис `tailwind` в compose);
- `make bundle-install`;
- `make help` — список целей.

Переменная `COMPOSE` по умолчанию `docker compose`; при необходимости: `make test COMPOSE="docker-compose"`.

## Подзадача 2.6

**Цель:** убедиться, что в браузере подключается скомпилированный CSS Tailwind и классы из разметки попадают в сборку.

**Проверено:**

1. **Артефакт сборки** — в `app/assets/builds/tailwind.css` присутствуют утилиты, используемые в `application.html.erb` (например `.container`, `.mx-auto`, `.mt-28`, `.flex`, `.px-5`).
2. **Сборка в Docker:** `docker compose run --rm web bash -lc "bin/rails tailwindcss:build"` завершается успешно (`Done in …ms`).
3. **Подключение в layout:** рендер с `layout: "application"` даёт теги вида  
   `href="/assets/tailwind-<digest>.css"` (и связанные `application*.css` через Propshaft).

**Команда для повторной проверки рендера:**

```bash
docker compose run --rm web bash -lc 'bin/rails runner "puts ApplicationController.render(inline: %q(<p>x</p>), layout: %q(application)).lines.grep(/stylesheet|tailwind/)"'
```

**Ручная проверка в браузере:** `docker compose up` (сервисы `web` и `tailwind`), открыть любую страницу с layout (например после настройки `root` или временно через `rails/info` в dev) — ожидаются отступы/контейнер согласно классам в `<body>`.

## Подзадача 2.1

**Проверка `Gemfile`:**

| Гем | Статус |
|-----|--------|
| `turbo-rails` | есть (`gem "turbo-rails"`) |
| `stimulus-rails` | есть (`gem "stimulus-rails"`) |
| `hotwire-rails` | **не добавлять** — мета-гем [архивирован](https://github.com/hotwired/hotwire-rails) (последняя версия на RubyGems — 0.1.3, 2021); в современных приложениях Hotwire = Turbo + Stimulus через `turbo-rails` и `stimulus-rails`, как в шаблоне Rails 8. |

Пункт плана про «три гема» следует понимать в духе «стек Hotwire присутствует»; отдельная строка `hotwire-rails` в актуальном `Gemfile` не требуется и вводит устаревшую зависимость.

## Подзадача 2.2

**Команда из плана:** `bin/rails hotwire:install` доступна только с гемом `hotwire-rails`, который в этом проекте намеренно не подключаем (см. 2.1).

**Эквивалент в Docker** (тот же набор шагов, что выполняет `hotwire:install` поверх importmap):

```bash
docker compose run --rm web bash -lc "bin/rails turbo:install:importmap && bin/rails stimulus:install:importmap"
```

Выполнено: оба инсталлятора отработали с `unchanged` / `identical` — конфигурация после `rails new` уже соответствовала Hotwire (Turbo + Stimulus + importmap).

## Подзадача 2.3

**Гем:** в `Gemfile` указан `tailwindcss-rails` (в lock — 4.4.0 с Tailwind CSS 4.2.1).

**Сборка:** в Docker проверено:

```bash
docker compose run --rm web bash -lc "bin/rails tailwindcss:build"
```

Вывод: `Done in …ms`, артефакт `app/assets/builds/tailwind.css` обновляется.

**Файл из плана `app/assets/stylesheets/application.tailwind.css`:** добавлен в репозиторий (указатель на канонический вход для гема 4.x). Реальный вход для CLI — `app/assets/tailwind/application.css` (`@import "tailwindcss"`), см. `lib/tailwindcss/commands.rb` в геме `tailwindcss-rails`.

**Подключение в браузере:** `stylesheet_link_tag :app` (Propshaft) подмешивает все `app/assets/**/*.css`, включая `builds/tailwind.css` и стили из `app/assets/stylesheets/`.

## Подзадача 2.4

**Цель плана:** держать пересборку CSS в фоне во время разработки.

**Procfile:** в `Procfile.dev` процесс `css` запускает `bin/rails tailwindcss:watch` рядом с `web` (`bin/rails server`). Старт обоих процессов: `./bin/dev` (Foreman читает `Procfile.dev`).

**Проверка в Docker** (один прогон watch; контейнер завершился по таймауту):

```bash
docker compose run --rm web bash -lc "bin/rails tailwindcss:watch"
```

Альтернатива без отдельного сервиса: второй терминал с той же командой или `bin/dev` внутри контейнера; для Compose см. п. 2.5.

## Подзадача 2.5

**Сервис в Compose:** добавлен сервис `tailwind` (тот же образ и тома, что у `web`), команда по умолчанию — `bin/rails tailwindcss:watch`. Entrypoint по-прежнему выполняет `bundle install` и `db:prepare` перед `exec`.

**Запуск обоих процессов:**

```bash
docker compose up
```

или явно: `docker compose up web tailwind`.

**Только watch (без Puma):** `docker compose up tailwind` или `docker compose run --rm tailwind`.
