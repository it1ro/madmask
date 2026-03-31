# Итерация 8: Docker для продакшена и Kamal (статус)

| Подзадача | Статус |
|-----------|--------|
| 8.1 Production Dockerfile (multi-stage + assets precompile) | выполнено |
| 8.2 `.dockerignore` | выполнено (проверено и уточнено) |
| 8.3 Установка Kamal | выполнено (gem в `Gemfile`, binstub `bin/kamal`) |
| 8.4 `kamal init` | выполнено (`config/deploy.yml`, `.kamal/` присутствуют) |
| 8.5 Правки `config/deploy.yml` | выполнено (сервер `77.105.168.30`, домен `madmask.ilmir.tech`, SSH key `~/.ssh/madmask_ed25519`, registry `ghcr.io/it1ro/madmask`, volume `/var/lib/madmask/storage`) |
| 8.6 Подготовка сервера (Docker/SSH) | готово (runbook + команды) |
| 8.7 `kamal setup` | готово к выполнению (команды в runbook) |
| 8.8 `kamal deploy` | готово к выполнению (команды в runbook) |

## Важные нюансы (исправлено/учтено)

- Включён SSL-режим Rails для работы за `kamal-proxy` (`config.assume_ssl`, `config.force_ssl`), с исключением редиректа для healthcheck `/up`.
- Исправлен workflow деплоя: `actions/checkout@v4` (вместо несуществующего `@v6`).
- Права на volume для SQLite/Active Storage: контейнер в production работает от пользователя `rails` (uid 1000), поэтому директория на сервере должна быть доступна для записи uid=1000.
- Локальный запуск `kamal` из dev-контейнера: добавлен временный `git safe.directory` для `/app/.git`, чтобы обойти `fatal: detected dubious ownership` без записи в глобальный git config.
- GHCR: при ошибке `denied: denied` нужно проверить PAT для `it1ro` (scopes `write:packages` + `read:packages`, и `repo` если репозиторий приватный) и соответствие `registry.username` в `config/deploy.yml`.

## Сделано в 8.1

- Добавлен production `Dockerfile` (root) в многоступенчатом формате:
  - build stage: `bundle install`, `bootsnap precompile`, `rails assets:precompile`;
  - runtime stage: только runtime-зависимости (sqlite, vips), запуск `bin/rails server`.
- Сохранён dev-образ в `Dockerfile.dev`, `docker-compose.yml` переключён на него.

## Уточнения в 8.2–8.4

- `.dockerignore` обновлён: добавлены `storage/` и SQLite-файлы из `db/`, убран слишком широкий игнор `*.md` (чтобы не выкидывать `README.md` из build context).
- Kamal подтверждён в проекте: `gem "kamal"` в `Gemfile`, версия присутствует в `Gemfile.lock`, binstub `bin/kamal` на месте.
- `kamal init` уже выполнен ранее: есть `config/deploy.yml` и `.kamal/`.

## Runbook (8.6–8.8)

### 0) Локально: подготовить секреты и доступ к GHCR

- Экспортировать токен GHCR (нужен `write:packages`):
  - `export KAMAL_REGISTRY_PASSWORD="***"`
- Экспортировать master key Rails (никогда не коммитить `config/master.key`):
  - `export RAILS_MASTER_KEY="***"`

Опционально (удобнее): использовать `direnv` и локальный `.envrc` (см. `.envrc.example`).

### 1) Сервер: подготовка (один раз)

- Установить Docker Engine и плагин Compose, убедиться что демон запущен.
- Создать директорию под персистентные данные:
  - `sudo mkdir -p /var/lib/madmask/storage`
  - `sudo chown -R 1000:1000 /var/lib/madmask/storage`
  - (если нужен root-владелец каталога `/var/lib/madmask`, то права выставлять точечно, главное — чтобы `/var/lib/madmask/storage` был writable для uid=1000)
- Проверить SSH-доступ ключом деплоя:
  - `ssh -i ~/.ssh/madmask_ed25519 root@77.105.168.30 "docker --version"`

### 2) Первый setup

- `make kamal-setup`

### 3) Деплой

- `make kamal-deploy`

### 4) Проверки после деплоя

- Логи: `make kamal-logs`
- Консоль: `make kamal-console`

### 5) CI деплой (GitHub Actions)

- Добавить secrets в GitHub Environment `production`:
  - `KAMAL_REGISTRY_PASSWORD` (GHCR token с `write:packages`)
  - `RAILS_MASTER_KEY`
  - `SSH_PRIVATE_KEY` (ключ для доступа к серверу)
- Workflow: `.github/workflows/deploy.yml` (запуск вручную или при push в `main`)

