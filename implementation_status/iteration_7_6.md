# Итерация 7.6: WebGL visual improvements (transparency + lighting + environment)

## Статус

| Подзадача | Результат |
|-----------|-----------|
| 7.6.1 canvas transparency | `webgl_preview_controller.js`: `WebGLRenderer({ alpha: true })`, `scene.background = null`, `setClearColor(..., 0)` — градиент контейнера снова виден под canvas. |
| 7.6.2 lighting theme | `webgl_preview_controller.js`: тематические источники (HemisphereLight + rim/fill DirectionalLights) под `DESIGN_GUIDELINES.md`. |
| 7.6.3 hdr environment | `webgl_preview_controller.js`: добавлена поддержка HDRI через `RGBELoader` + `PMREMGenerator`. Кандидаты: `/hdr/madmask_env_1.hdr`, `/hdr/madmask_env_2.hdr`. Если HDRI недоступен — используется procedural equirectangular fallback. |
| 7.6.4 tone/exposure | `webgl_preview_controller.js`: настройка `renderer.toneMappingExposure = 1.45` для читаемости в тёмных сценах. |
| 7.6.5 optional bloom | Не добавлялось (следующая итерация по результатам визуальной проверки). |
| 7.6.6 dispose-and-qa | Добавлена очистка `scene.environment` и dispose envMap/текстур в `disconnect`. |

## Примечания

- В `public/hdr/` добавлены placeholder HDRI ассеты `madmask_env_1.hdr` и `madmask_env_2.hdr`, чтобы устранить 404 и обеспечить PBR-friendly окружение.

## Ручная проверка (чеклист)

1. Открыть `/products/:id` у разных товаров (несколько моделей, в т.ч. “тёмные”).
2. Проверить, что canvas полупрозрачный и через него видно градиент блока 3D превью.
3. Проверить, что при уходе со страницы canvas исчезает и больше не создаётся при возврате (dispose не ломает повторную инициализацию).
4. Проверить console на отсутствие ошибок `HDRI load failed` (допустимы WARN при отсутствии файлов).

