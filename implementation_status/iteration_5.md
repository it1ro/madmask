# Итерация 5: Stimulus WebGL (webgl_preview)

## Статус

| Подзадача | Результат |
|-----------|-----------|
| 5.1 `bin/rails generate stimulus webgl_preview` | Контроллер уже существовал; повторный запуск генератора даёт conflict — файл не перезаписывался |
| 5.2 Логика в `webgl_preview_controller.js` | Реализовано: `connect` (сцена, камера, свет, рендерер, OrbitControls, ResizeObserver, rAF), динамический `import()` Three/OrbitControls/GLTFLoader, `GLTFLoader` + нормализация масштаба, fallback-куб при пустом URL/ошибке загрузки, ограничение `devicePixelRatio`, проверка WebGL, `disconnect` с dispose |
| 5.3 `data-controller` на контейнере | Уже было: `data-controller="webgl-preview"`, `data-webgl-preview-model-url-value` в `app/views/products/show.html.erb` |

## Технические детали

- Пины Three.js **0.170.0** в `config/importmap.rb` (ядро + `OrbitControls` + `GLTFLoader`), чтобы работали динамические импорты и Turbo-навигация без дублирующего importmap в вьюхе.
- Дублирующий `<script type="importmap">` и модуль с `window.THREE` убраны из `products/show.html.erb`; глобали `window.THREE` / `window.OrbitControls` выставляются в `connect` после импорта.
- Проверка: открыть страницу товара с `model_url` на публичный GLB (например, тестовый с CDN Khronos/GitHub) или без URL — ожидается куб-заглушка.

## Команды проверки

```bash
docker compose run --rm web bin/rails test
# в браузере: страница товара, консоль — THREE после загрузки превью
```
