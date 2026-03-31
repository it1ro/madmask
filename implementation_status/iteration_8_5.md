# Итерация 8.5: Security hardening + аудит (статус)

| Подзадача | Статус |
|-----------|--------|
| 8.5.1 Секреты и ключи (критично) | выполнено (локальные секреты удалены из рабочего дерева; gitignore покрывает ключи/окружение) |
| 8.5.4 Безопасность зависимостей и CI | выполнено (CI прогоняет brakeman/bundler-audit/importmap audit/rubocop/тесты; `bin/bundler-audit` по умолчанию делает `check --update`; `config/bundler-audit.yml` без фиктивных CVE и с правилами осознанных игноров) |
| 8.5.3 CSP и базовые security headers | выполнено (включён CSP с nonce для importmap, разрешены Google Fonts; в `production` ограничены `config.hosts` и настроен `host_authorization` с исключением `/up`; расширен `filter_parameters`) |

## Проверки по 8.5.1

- `.gitignore` уже содержит игнор `/.env*`, `/.envrc` и `/config/*.key` (включая `config/master.key`).
- `config/master.key` в рабочем дереве существует, но **не отслеживается** git.
- Локальный `.envrc` (с реальными `KAMAL_REGISTRY_PASSWORD` и `RAILS_MASTER_KEY`) удалён из рабочего дерева; используйте `.envrc.example` как шаблон.

