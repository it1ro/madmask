# Итерация 7.5: Производительность (Lighthouse + WebGL profiler)

## Статус

| Подзадача | Результат |
|-----------|-----------|
| 7.5.1 Lighthouse desktop (`/`) | `Performance` = `0.84`, `LCP` = `2.5 s`, `TBT` = `60 ms`, `CLS` = `0.019`, `Max Potential First Input Delay` = `220 ms` |
| 7.5.2 Lighthouse mobile (`/`) | `Performance` = `0.96`, `LCP` = `2.5 s`, `TBT` = `150 ms`, `CLS` = `0`, `Max Potential First Input Delay` = `200 ms` |
| 7.5.3 Проверка WebGL на `/` | На `home` нет `data-controller="webgl-preview"` и нет инициализации 3D-рендера (контроллер подключается только при наличии контейнера с `data-controller="webgl-preview"`). |
| 7.5.4 WebGL profiler на `products#show` | На `products/1` контроллер доходит до `data-webgl-preview-state="model-loaded"` и создаёт `<canvas>`. Сняты frame time / FPS по `requestAnimationFrame` через CDP (headless-ограничения см. ниже). |
| 7.5.5 Поведение при навигации | При уходе `products/1 -> /` `<canvas>` исчезает (`canvasCount: 0`), при возврате `canvasCount: 1`, состояние снова `model-loaded` (dispose в `disconnect` работает). |
| 7.5.6 Оценка оптимальности графики лендинга | По Lighthouse “узкие места” показали в основном JS/minification в dev-сценарии, а не hero-noise/gradient. Тем не менее кандидаты для проверки: `.hero-section__noise`, `.hero-section__gradient-shift` и тяжёлые drop/text shadows. |

## Детали результатов

### 7.5.1–7.5.2 Lighthouse на лендинге (`/`)

Тесты запускались в Docker dev-среде и через headless Chrome.

Desktop:
- `Performance`: `0.84`
- `LCP`: `2.5 s`
- `CLS`: `0.019`
- `TBT`: `60 ms`
- `Max Potential First Input Delay`: `220 ms`
- Opportunities (top): `Minify JavaScript`, `Reduce unused JavaScript` (в dev-режиме, т.к. Lighthouse рекомендует minification/снижение неиспользуемого JS).

Mobile:
- `Performance`: `0.96`
- `LCP`: `2.5 s`
- `CLS`: `0`
- `TBT`: `150 ms`
- `Max Potential First Input Delay`: `200 ms`

Примечание по `INP`: в данном Lighthouse-ранe INP не был вычислен как отдельная метрика (в отчёте отсутствовали значения INP), поэтому для “отзывчивости” использован прокси `Max Potential First Input Delay`.

### 7.5.4 WebGL profiler на `products/1` (модель загружена)

Измерения сняты через CDP в headless-режиме (важно: headless может занижать реальный FPS из-за ограничений на rAF/рендер в среде без полноценного графического пайплайна).

Первый заход на страницу товара:
- state: `model-loaded`
- FPS (по rAF-сэмплированию на ~4.5s): `~2.0`
- frame time: mean `541 ms`, p50 `583 ms`, p95 `617 ms`
- `pixelRatio`: `1`
- `renderer.info.memory`: `textures=0`, `geometries=8` (у модели не было заметных текстур)

После навигации `products/1 -> /` и возврата `products/1`:
- `homeCanvasCount`: `0`
- state: `model-loaded`
- FPS (по rAF-сэмплированию на ~4.5s): `~1.56`
- frame time: mean `669 ms`, p50 `767 ms`, p95 `817 ms`
- `pixelRatio`: `1`
- `renderer.info.memory`: `textures=0`, `geometries=8`

## Команды проверки

### Lighthouse

Desktop:
```bash
npx -y lighthouse@latest --chrome-path=/usr/bin/google-chrome-stable \
  --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" \
  --preset=desktop \
  --output=json --output=html --output-path=tmp/lighthouse \
  http://localhost:3000/
```

Mobile (emulation via `--form-factor=mobile`):
```bash
npx -y lighthouse@latest --chrome-path=/usr/bin/google-chrome-stable \
  --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" \
  --preset=desktop --form-factor=mobile \
  --screenEmulation.mobile --screenEmulation.width=390 --screenEmulation.height=844 --screenEmulation.deviceScaleFactor=2 \
  --output=json --output=html --output-path=tmp/lighthouse-mobile \
  http://localhost:3000/
```

### WebGL profiler

CDP-снятие выполнено headless Chrome на `/products/1` с ожиданием `data-webgl-preview-state="model-loaded"` и последующей сэмпл-трассировкой `requestAnimationFrame` на 4.5 секунды. Также проверено, что после навигации на `/` `<canvas>` исчезает.

## Вывод

1) По Lighthouse baseline лендинга — в целом приемлемый (`Performance` `0.84` desktop / `0.96` mobile), а главные opportunities связаны с minification/unused JS (dev-настройки), а не с визуальными hero-эффектами.

2) WebGL на `products/1` в headless-режиме стабильно работает до `model-loaded`, dispose после навигации подтверждён через исчезновение canvas. При этом абсолютные FPS в headless могут отличаться от реального устройства, поэтому для финального утверждения стоит отдельно прогнать измерения на реальном девайсе/в non-headless окружении.

