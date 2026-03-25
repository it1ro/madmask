# Итерация 4 — Three.js (CDN / ES modules)

## 4.1 (выполнено)

- Three.js **0.170.0** и OrbitControls из **одной версии** через `importmap` (jsDelivr) + `type="module"`; глобально выставлены `window.THREE` и `window.OrbitControls` для отладки в консоли.
- Скрипты только на `products#show`: `content_for :head` (importmap) и `content_for :three_js` (модуль в конце `body`).

## 4.2 (выполнено)

- В консоли браузера на странице товара доступны `THREE` и `OrbitControls` (модуль в `content_for :three_js`).

## 4.3 (выполнено)

- В `app/views/products/show.html.erb`: контейнер `#canvas-container` с `data-controller="webgl-preview"` и `data-webgl-preview-model-url-value` из `effective_model_url` (классы позиционирования поверх обложки).

## 4.4 (выполнено)

- Проверка ответа `GET http://localhost:3000/products/2`: **HTTP 200**; в HTML присутствуют `id="canvas-container"`, `data-controller="webgl-preview"`, `data-webgl-preview-model-url-value` (пусто или URL блоба при вложенной модели). Контейнер в разметке отображается в блоке превью (поверх обложки).

## Прочее

- Заглушка `webgl_preview_controller.js` (полная логика — итерация 5).
