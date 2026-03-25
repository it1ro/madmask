# Итерация 4 — Three.js (CDN / ES modules)

## 4.1 (выполнено)

- Three.js **0.170.0** и OrbitControls из **одной версии** через `importmap` (jsDelivr) + `type="module"`; глобально выставлены `window.THREE` и `window.OrbitControls` для отладки в консоли.
- Скрипты только на `products#show`: `content_for :head` (importmap) и `content_for :three_js` (модуль в конце `body`).
- На `show.html.erb`: контейнер `#canvas-container` с `data-controller="webgl-preview"` и `data-webgl-preview-model-url-value`.
- Заглушка `webgl_preview_controller.js` (полная логика — итерация 5).
