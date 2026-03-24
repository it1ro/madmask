# Итерация 2: Hotwire и Tailwind (статус)

| Подзадача | Статус |
|-----------|--------|
| 2.1 Gemfile: `hotwire-rails`, `turbo-rails`, `stimulus-rails` | выполнено |

## Подзадача 2.1

**Проверка `Gemfile`:**

| Гем | Статус |
|-----|--------|
| `turbo-rails` | есть (`gem "turbo-rails"`) |
| `stimulus-rails` | есть (`gem "stimulus-rails"`) |
| `hotwire-rails` | **не добавлять** — мета-гем [архивирован](https://github.com/hotwired/hotwire-rails) (последняя версия на RubyGems — 0.1.3, 2021); в современных приложениях Hotwire = Turbo + Stimulus через `turbo-rails` и `stimulus-rails`, как в шаблоне Rails 8. |

Пункт плана про «три гема» следует понимать в духе «стек Hotwire присутствует»; отдельная строка `hotwire-rails` в актуальном `Gemfile` не требуется и вводит устаревшую зависимость.
