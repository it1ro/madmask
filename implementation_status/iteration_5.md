# Итерация 5: Stimulus WebGL (webgl_preview)

## Статус

| Подзадача | Результат |
|-----------|-----------|
| 5.1 `bin/rails generate stimulus webgl_preview` | Контроллер уже существовал; повторный запуск генератора даёт conflict — файл не перезаписывался |
| 5.2 Логика в `webgl_preview_controller.js` | Реализовано: `connect` (сцена, камера, свет, рендерер, OrbitControls, ResizeObserver, rAF), динамический `import()` Three/OrbitControls/GLTFLoader, `GLTFLoader` + нормализация масштаба, fallback-куб при пустом URL/ошибке загрузки, ограничение `devicePixelRatio`, проверка WebGL, `disconnect` с dispose |
| 5.3 `data-controller` на контейнере | `data-controller="webgl-preview"`, `data-webgl-preview-model-url-value` = `effective_model_url` (URL блоба при вложении) |
| 5.4 Источник GLB | только `has_one_attached :model_file`; колонка `model_url` удалена; админка: загрузка / удаление вложения; тесты в `test/models/product_test.rb` |

## Технические детали

- Пины Three.js **0.170.0** в `config/importmap.rb` (ядро + `OrbitControls` + `GLTFLoader`), чтобы работали динамические импорты и Turbo-навигация без дублирующего importmap в вьюхе.
- Дублирующий `<script type="importmap">` и модуль с `window.THREE` убраны из `products/show.html.erb`; глобали `window.THREE` / `window.OrbitControls` выставляются в `connect` после импорта.
- Превью только из **`has_one_attached :model_file`**; `Product#effective_model_url` возвращает `rails_blob_path` при вложении, иначе `nil` (куб).
- Админка: загрузка файла, чекбокс удаления вложения.
- Проверка: страница товара с GLB в storage; без файла — куб-заглушка.
- Детальная страница: 3D в отдельной секции `#product-3d-preview` (обложка — отдельный блок ниже, без наложения на canvas); фон сцены `#0A050F`, рендерер без альфы; `connect` с `try/catch` и сообщением при сбое импорта; в каталоге при вложенной модели — отдельный блок со ссылкой на якорь 3D.

## Команды проверки

```bash
docker compose run --rm web bin/rails test
# в браузере: страница товара, консоль — THREE после загрузки превью
```
