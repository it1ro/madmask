## Что сделано

- В `config/deploy.yml` увеличен `proxy.deploy_timeout` до `"180s"`, чтобы Kamal proxy не падал раньше, чем контейнер успевает пройти healthcheck и поднять приложение.
- В `config/deploy.yml` исправлено имя образа с `ghcr.io/it1ro/madmask` на `it1ro/madmask` при наличии `registry.server: ghcr.io`, чтобы убрать некорректный тег `ghcr.io/ghcr.io/...` в CI.

## Зачем

- Дефолтные 30 секунд ожидания у proxy конфликтовали с настройками healthcheck и временем старта приложения (включая `db:prepare`).
- Двойной префикс реестра ломал корректное формирование имени образа при сборке/пуше.

## Как проверить

- Повторить деплой и убедиться, что:
  - в логах build/push образ выглядит как `ghcr.io/it1ro/madmask:<tag>`,
  - `kamal-proxy deploy` использует `--deploy-timeout="180s"` и дожидается healthy,
  - приложение отвечает на `/up` после старта.

