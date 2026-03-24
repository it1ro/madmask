# Итерация 2: Hotwire и Tailwind (статус)

| Подзадача | Статус |
|-----------|--------|
| 2.1 Gemfile: `hotwire-rails`, `turbo-rails`, `stimulus-rails` | выполнено |
| 2.2 Установка Hotwire (`hotwire:install` или эквивалент) | выполнено |
| 2.3 Tailwind: `tailwindcss-rails`, сборка, файл стилей | выполнено |

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
