# Madmask — Docker-first shortcuts (see .cursorrules: use compose for app commands).
# Default compose project name is the directory name; override with COMPOSE_PROJECT_NAME.

COMPOSE ?= docker compose
RUN_WEB := $(COMPOSE) run --rm web
RUN_TAILWIND := $(COMPOSE) run --rm tailwind
EXEC_WEB := $(COMPOSE) exec web

.PHONY: help up up-d down build logs bash shell rails console routes test lint \
	db-prepare db-migrate db-rollback db-seed db-reset \
	tailwind-build tailwind-watch bundle-install setup ci exec-bash

help:
	@echo "Madmask — команды через Docker (сервис web; см. docker-compose.yml):"
	@echo ""
	@echo "  make up / up-d     — docker compose up / up -d (web + tailwind)"
	@echo "  make down          — остановить контейнеры"
	@echo "  make build         — собрать образы"
	@echo "  make logs          — логи всех сервисов (-f)"
	@echo "  make bash          — интерактивная оболочка в одноразовом контейнере web"
	@echo "  make exec-bash     — bash в уже запущенном web (быстрее при make up)"
	@echo ""
	@echo "Rails (внутри контейнера):"
	@echo "  make console       — bin/rails console"
	@echo "  make routes        — bin/rails routes"
	@echo "  make test          — bin/rails test"
	@echo "  make lint          — bin/rubocop"
	@echo "  make setup         — bin/setup"
	@echo "  make ci            — bin/ci"
	@echo "  make rails ARGS=\"…\"  — произвольно, напр. ARGS=\"db:migrate\""
	@echo ""
	@echo "База данных:"
	@echo "  make db-prepare | db-migrate | db-rollback | db-seed | db-reset"
	@echo ""
	@echo "Tailwind:"
	@echo "  make tailwind-build   — одноразовая сборка CSS"
	@echo "  make tailwind-watch   — watch в одноразовом контейнере tailwind"
	@echo ""
	@echo "  make bundle-install  — bundle install в контейнере web"

up:
	$(COMPOSE) up

up-d:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f

bash shell:
	$(RUN_WEB) bash

exec-bash:
	$(EXEC_WEB) bash

rails:
	$(RUN_WEB) bin/rails $(ARGS)

console:
	$(RUN_WEB) bin/rails console

routes:
	$(RUN_WEB) bin/rails routes

test:
	$(RUN_WEB) bin/rails test

lint:
	$(RUN_WEB) bin/rubocop

setup:
	$(RUN_WEB) bin/setup

ci:
	$(RUN_WEB) bin/ci

db-prepare:
	$(RUN_WEB) bin/rails db:prepare

db-migrate:
	$(RUN_WEB) bin/rails db:migrate

db-rollback:
	$(RUN_WEB) bin/rails db:rollback

db-seed:
	$(RUN_WEB) bin/rails db:seed

db-reset:
	$(RUN_WEB) bin/rails db:reset

tailwind-build:
	$(RUN_WEB) bin/rails tailwindcss:build

tailwind-watch:
	$(RUN_TAILWIND) bash -lc "bin/rails tailwindcss:watch"

bundle-install:
	$(RUN_WEB) bundle install
