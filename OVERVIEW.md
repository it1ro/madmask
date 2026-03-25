# OVERVIEW.md – Rails 8 + Hotwire + WebGL 3D-превью товаров

## Цель проекта
Создать интернет-магазин масок и фигурок в жанрах fantasy, horror, sci‑fi, cyberpunk.  
Каждая карточка товара должна содержать интерактивное 3D‑превью (вращение мышью/пальцем) в стиле сервиса Meshy AI.  
Дизайн – тёмный, с микроанимациями, выдержанный в тематике масок.

**MVP (первая версия):** каталог, детальная страница с 3D, защищённый CRUD товаров. **Корзина, оплата и оформление заказа в MVP не входят** — см. [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) для первичного CTA на детальной странице, согласованного с этим scope.

## Стек технологий
- **Ruby on Rails 8.1+** – backend, API, генерация страниц  
- **SQLite** – база данных (production‑ready через WAL; см. ниже про ограничения)  
- **Hotwire** – Turbo Drive, Turbo Frames, Turbo Streams, Stimulus  
- **Tailwind CSS** – стилизация, адаптивная сетка, анимации  
- **Three.js** – WebGL-рендеринг (CDN с **зафиксированной версией** или **importmap pin** — предпочтительнее для продакшена и CSP)  
- **Docker** – контейнеризация (dev и prod)  
- **Kamal 2** – деплой на один VPS (без CI/CD на первых этапах)

## Функциональные требования
1. **Управление товарами (CRUD)**
   - Модель `Product` с полями:
     - `name` (string)
     - `description` (text)
     - `price` (decimal)
     - `category` (string) – fantasy, horror, sci‑fi, cyberpunk
     - **3D-модель:** **Active Storage** — `has_one_attached :model_file` (GLB/GLTF), загрузка только через админку; отдельного URL в БД нет.
   - **Обложка для fallback (WebGL / ошибка):** **Active Storage** — `has_one_attached :cover_image` (или `has_many` при необходимости); валидации типа (image) и размера по согласованию. Не хранить обложку как произвольный string-URL в MVP, если не принято иное для совместимости со старыми данными.
   - **Админка:** только под аутентификацией (см. раздел «Админка и аутентификация»). Публичные маршруты — `index` / `show` (и опционально фильтры).
   - Публичная страница со списком товаров (grid) и детальная страница с 3D‑превью.

2. **3D‑превью товара**
   - На детальной странице товара – полноэкранный или крупный canvas с моделью.
   - Возможность вращать, масштабировать (OrbitControls).
   - Загрузка модели через вложение `model_file` (итоговый путь для клиента — `effective_model_url` → URL блоба Active Storage); **целевой формат MVP — GLB** (при необходимости позже — полный glTF + `.bin`).
   - При отсутствии модели или ошибке загрузки — заглушка (куб) и/или **обложка из Active Storage** (см. DESIGN_GUIDELINES).
   - Адаптация под мобильные устройства (touch); при уходе со страницы — **остановка рендера и dispose** ресурсов в `disconnect` Stimulus (Turbo-friendly).

3. **Микроанимации и стилизация**
   - Tailwind для адаптивной сетки карточек.
   - Плавные переходы; Turbo Streams — по мере необходимости (не обязательны для первого прохода админки).
   - Тематические цвета и шрифты — по [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md).

4. **Производительность**
   - Подключать Three.js и OrbitControls **одной совместимой версией** (например, pin в importmap или два `<script>` с одной версией с cdn.jsdelivr.net/npm — **не использовать нестабильные CDN без pin**).
   - Скрипты Three/controls — **только на странице товара** (или динамическая подгрузка), чтобы не грузить каталог.
   - Модели: только через **Active Storage** (в том числе на проде — в volume `/rails/storage`); лимиты размера — на уровне загрузки/политики.

## Админка и аутентификация
- Маршруты CRUD под **`/admin`** (например, `Admin::ProductsController`), **не** публичный `resources :products` без ограничений.
- Варианты: встроенный **`rails generate authentication`** (Rails 8), **Devise**, или **HTTP Basic** для очень малого MVP — зафиксировать выбранный вариант в коде и в секретах (`RAILS_MASTER_KEY` / credentials / env).
- Обязательно: `before_action :authenticate_*` на всех admin-действиях; после логина — доступ к CRUD и загрузке обложек.

## Three.js, OrbitControls и CSP
- **OrbitControls** импортируется из `examples/jsm/controls/OrbitControls` **той же версии**, что и `three` (через importmap pin или ES-модули с CDN одной версии).
- **CSP:** при строгой политике разрешить нужные источники скриптов или отдавать скрипты с того же хоста (importmap + asset pipeline).
- GLB отдаются **с того же origin** (Active Storage / Rails), отдельная настройка CORS для внешних URL моделей не требуется.

## Хранение 3D-моделей и данные по средам

| Среда | Где лежат GLB | Что в БД |
|--------|----------------|----------|
| Dev / MVP | `storage/` (Active Storage) | только `active_storage_*` + привязка к товару |
| Production | volume `/rails/storage` (или S3-адаптер Active Storage при масштабировании) | то же |

- При переходе на **S3** для Active Storage: политика CORS, лимит размера загружаемых моделей, отдельный prefix/bucket при необходимости.

## Архитектурные решения
### Backend (Rails)
- **Генерация проекта:**  
  `rails new . -d sqlite3 -c tailwind --skip-jbuilder`
- **Модели:** `Product` с указанными полями и Active Storage для обложки.
- **Контроллеры:** публичный `ProductsController` (`index`, `show`), `Admin::ProductsController` для CRUD.
- **Вьюхи:** ERB; **Turbo Frames / Streams** — по желанию для админки (обновление списка после create/update); для минимального MVP достаточно обычных редиректов — тогда в коде не обязательны Frames на первом шаге.
- **Маршруты:** `resources :products, only: [:index, :show]` публично; `namespace :admin do resources :products end` для CRUD.

### Frontend (Hotwire + WebGL)
- **Stimulus `webgl_preview_controller.js`:**
  - Сцена, камера, освещение (детали — [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md), §5).
  - Загрузка GLB по URL из value/target; нормализация масштаба (подогнать модель к единому bbox).
  - OrbitControls; ResizeObserver; **проверка поддержки WebGL**; при ошибке — куб + показ обложки.
  - **disconnect:** `cancelAnimationFrame`, `renderer.dispose`, dispose геометрий/материалов/текстур загруженной модели, отключение контролов.
- **Импорт Three.js:** предпочтительно **importmap** (`bin/importmap pin three@X.Y.Z`) и аналогично для модуля controls **той же версии**; альтернатива — два pin на jsDelivr с фиксированными версиями.
- **Стили:** Tailwind + кастом в `app/assets/stylesheets/application.tailwind.css`.

### SQLite в production
- Монтировать volume **`/rails/storage`** (или путь, заданный в Kamal), чтобы файл БД переживал деплой.
- **WAL:** включить режим журнала WAL для SQLite (например, через `PRAGMA journal_mode=WAL` в инициализации или документированный способ Rails 8 для SQLite). Так согласуется с [.cursorrules](.cursorrules).
- **Ожидания по нагрузке:** один writer; в основном чтение каталога; короткие транзакции записи; избегать долгих блокирующих операций в том же процессе. При росте записей — рассмотреть **Postgres** и/или **Litestream** для репликации бэкапов.
- **IMMEDIATE транзакции** не обязательны для старта; при появлению конкурирующих записей — проектировать явно (отдельный подраздел в коде/доке).

### Бэкапы SQLite (минимальный чеклист)
- Периодически копировать файл БД **вне сервера приложения** (объектное хранилище, другой хост).
- Хранить несколько поколений; периодически проверять **восстановление** на тестовой копии.
- Опционально: **Litestream** вместо или вместе с cron.

### Docker + Kamal
- **Dockerfile (prod):** многоступенчатый, `ruby:3.x-slim`, зависимости, assets.
- **Docker Compose (dev):** сервис `web` (и при необходимости вспомогательные) — см. шаг плана ниже; команды разработки — из контейнера ([.cursorrules](.cursorrules)).
- **Kamal:** `config/deploy.yml` — volume для `storage`, registry, env.
- **SSL и домен:** использовать встроенный **Kamal proxy** (Traefik) с Let’s Encrypt или внешний reverse proxy; в конфиге указать `host`, сертификаты/ACME по документации Kamal 2.
- **Переменные окружения (пример):** `RAILS_MASTER_KEY`, `RAILS_ENV=production`, `HOST` / `APP_HOST`, ключи S3 (`AWS_*` или совместимые), секреты аутентификации админки — через `kamal env` / credentials, не в репозитории.

## Чеклист WebGL и fallback (ссылка на дизайн)
1. Проверка WebGL; при отсутствии — статичная обложка (`cover_image`).
2. Индикатор загрузки модели; при сетевой/CORS ошибке — сообщение пользователю, кнопка «Повторить» (см. DESIGN §4–6).
3. Заглушка-куб при отсутствии вложенной модели или ошибке загрузки.
4. Очистка в `disconnect` при навигации Turbo.

## План реализации (последовательные шаги для Cursor AI)
1. **Создание проекта**
   - Сгенерировать Rails приложение с заданными опциями.
   - Настроить SQLite, Tailwind; убедиться, что Hotwire работает.

2. **Docker для разработки**
   - Добавить `Dockerfile` для dev (или общий с target `development`) и `docker-compose.yml` с сервисом приложения.
   - Дальнейшие команды генерации/миграций — через `docker compose run` / `exec` ([.cursorrules](.cursorrules)).

3. **Модель, Active Storage и миграции**
   - Модель `Product` с полями; `has_one_attached :cover_image` и `has_one_attached :model_file`; миграции и валидации (`name`, `price`, `category`).

4. **Аутентификация и админ CRUD**
   - Выбранный механизм auth; `namespace :admin`, `Admin::ProductsController`, защита `before_action`.
   - Scaffold или ручные вьюхи только под `/admin`.

5. **Публичный каталог**
   - `ProductsController#index`, `#show`; маршруты только публичные действия.

6. **Three.js (зафиксированная версия)**
   - importmap pin для `three` и OrbitControls **одной версии**, либо эквивалент с pin на jsDelivr; скрипты подключать на странице товара.

7. **Stimulus `webgl_preview`**
   - Инициализация, загрузка GLB, OrbitControls, resize, ошибки, disconnect/dispose.

8. **Детальная страница с 3D**
   - `show.html.erb`, data-атрибуты для URL модели и fallback обложки.

9. **Стилизация**
   - Tailwind по [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md); шрифты.

10. **Тесты (минимум)**
    - Тесты модели `Product` (валидации, вложения при необходимости).
    - Request/controller тесты для публичных страниц и для admin при наличии стратегии логина в тестах.

11. **Подготовка к деплою**
    - Production Dockerfile; `kamal init`, `deploy.yml`, proxy SSL, env, volume для SQLite.

12. **Деплой**
    - `kamal setup`, `kamal deploy`; проверка сохранения БД в volume.

13. **Резервное копирование (опционально)**
    - Cron-копия `.sqlite3` или Litestream по чеклисту выше.

## Дополнительные замечания
- **WebGL‑модели:** бесплатные GLB (Sketchfab и др.) или тестовый куб в `public/models/`.
- **Производительность:** снижение `devicePixelRatio` на мобильных, опционально отключение auto-rotate на слабых устройствах — по DESIGN_GUIDELINES.
- **Анимации:** CSS + Tailwind; детали длительностей и `prefers-reduced-motion` — в DESIGN_GUIDELINES.

## Результат
Готовый к деплою проект, в котором можно:
- безопасно управлять товарами в админке;
- указывать ссылку на 3D‑модель и обложку;
- просматривать интерактивное 3D‑превью на детальной странице с fallback;
- опираться на единый тёмный дизайн из гайдлайна.
