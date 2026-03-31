# Madmask — Docker-first shortcuts (see .cursorrules: use compose for app commands).
# Default compose project name is the directory name; override with COMPOSE_PROJECT_NAME.

COMPOSE ?= docker compose
RUN_WEB := $(COMPOSE) run --rm web
RUN_TAILWIND := $(COMPOSE) run --rm tailwind
EXEC_WEB := $(COMPOSE) exec web
export RAILS_MASTER_KEY ?= $(shell [ -f config/master.key ] && cat config/master.key)
export KAMAL_REGISTRY_PASSWORD
KAMAL_SSH_ARGS := $(if $(SSH_AUTH_SOCK),-e SSH_AUTH_SOCK=/ssh-agent -v $(SSH_AUTH_SOCK):/ssh-agent,-v $$HOME/.ssh:/root/.ssh:ro)
# Git 2.35+ blocks operations on repos with "dubious ownership" (common when the repo is bind-mounted).
# We do NOT persist any git config; we only set safe.directory for this process.
KAMAL_GIT_SAFE_ARGS := -e GIT_CONFIG_COUNT=2 -e GIT_CONFIG_KEY_0=safe.directory -e GIT_CONFIG_VALUE_0=/app -e GIT_CONFIG_KEY_1=safe.directory -e GIT_CONFIG_VALUE_1=/app/.git
KAMAL_RUN := $(COMPOSE) run --rm --entrypoint bash -e KAMAL_REGISTRY_PASSWORD -e RAILS_MASTER_KEY $(KAMAL_GIT_SAFE_ARGS) $(KAMAL_SSH_ARGS) web -lc
KAMAL_CMD := bundle check || bundle install && bin/kamal

.PHONY: help up up-d down build logs bash shell rails console routes test lint \
	db-prepare db-migrate db-rollback db-seed db-reset \
	tailwind-build tailwind-watch bundle-install setup ci exec-bash \
	kamal kamal-preflight kamal-setup kamal-deploy kamal-logs kamal-console kamal-shell kamal-secrets-check

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
	@echo ""
	@echo "Deploy (Kamal, запускается в dev-контейнере):"
	@echo "  make kamal ARGS=\"…\"     — произвольно, напр. ARGS=\"deploy\""
	@echo "  make kamal-setup        — первичная настройка сервера (kamal setup)"
	@echo "  make kamal-deploy       — деплой (kamal deploy)"
	@echo "  make kamal-logs         — tail логов"
	@echo "  make kamal-console      — Rails console в проде"
	@echo "  make kamal-shell        — shell в прод-контейнере"
	@echo "  make kamal-secrets-check — проверить, что секреты подхватываются (без вывода значений)"

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

kamal:
	$(KAMAL_RUN) "$(KAMAL_CMD) $(ARGS)"

kamal-preflight:
	@docker buildx version >/dev/null 2>&1 || ( \
		echo "ERROR: docker buildx не найден (нужен для Kamal image build)."; \
		echo ""; \
		echo "Arch Linux: sudo pacman -S docker-buildx"; \
		echo "Проверка:   docker buildx version"; \
		exit 1 \
	)
	@([ -n "$$KAMAL_REGISTRY_PASSWORD" ] || ( \
		echo "ERROR: KAMAL_REGISTRY_PASSWORD не задан."; \
		echo ""; \
		echo "Задай GitHub Container Registry token (PAT) с правами packages:write:"; \
		echo "  export KAMAL_REGISTRY_PASSWORD=..."; \
		echo ""; \
		echo "Либо разово через make:"; \
		echo "  make kamal-deploy KAMAL_REGISTRY_PASSWORD=..."; \
		exit 1 \
	))
	@([ -n "$$RAILS_MASTER_KEY" ] || ( \
		echo "ERROR: RAILS_MASTER_KEY не задан и config/master.key не найден."; \
		exit 1 \
	))

kamal-setup:
	@$(MAKE) kamal-preflight
	$(KAMAL_RUN) "$(KAMAL_CMD) setup"

kamal-deploy:
	@$(MAKE) kamal-preflight
	$(KAMAL_RUN) "$(KAMAL_CMD) deploy"

kamal-logs:
	@$(MAKE) kamal-preflight
	$(KAMAL_RUN) "$(KAMAL_CMD) logs"

kamal-console:
	@$(MAKE) kamal-preflight
	$(KAMAL_RUN) "$(KAMAL_CMD) console"

kamal-shell:
	@$(MAKE) kamal-preflight
	$(KAMAL_RUN) "$(KAMAL_CMD) shell"

kamal-secrets-check:
	@$(KAMAL_RUN) "$(KAMAL_CMD) secrets print | ruby -e 'STDIN.each_line { |line| k,v=line.split(\"=\",2); v=(v||\"\").strip; puts \"#{k}=<#{v.empty? ? \"empty\" : \"set\"}>\" }'"
