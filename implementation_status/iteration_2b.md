# Итерация 2b: Главная страница (лендинг) — статус

| Элемент | Статус |
|---------|--------|
| [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) — добавлена итерация 2b между ит. 2 и ит. 3 | документация обновлена |
| [DESIGN_GUIDELINES.md](../DESIGN_GUIDELINES.md) — раздел «Главная страница (лендинг)» | документация обновлена |

| 2b.1 Маршрутизация: `PagesController#home`, `root "pages#home"` | выполнено |
| 2b.2 Layout: шапка, подвал, CSS-переменные из гайдлайна, `products_path` (заглушка `products#index`) | выполнено |
| 2b.3 Hero: Cinzel/Orbitron, CTA «В каталог», градиент + шум + кибер-сетка, опциональная анимация градиента | выполнено |
| 2b.4 PNG: `madmask-logo.png` в шапке (lockup, hover glow), `madmask-image.png` в hero над H1, файлы в `public/images/` (статика по `/images/…`) | выполнено |
| 2b.5 Блок категорий: карточки жанров + **Custom** (заказные маски), SVG-иконки, токены `--color-category-*`, hover-свечение, ссылки на `products_path` с `category` | выполнено |
| 2b.6 Секция «Как это работает»: 3 шага (карточки, SVG), fade-in-up при скролле (`reveal_on_scroll` + Intersection Observer), `prefers-reduced-motion` | выполнено |
| 2b.7 Социальное доказательство / бренд: текст о ручной работе и коллекции; слоган с эффектом печатной машинки (`typewriter` Stimulus, старт при появлении в viewport; при `prefers-reduced-motion` — полный текст сразу); секция с `reveal-on-scroll` | выполнено |

Реализация секций лендинга — далее по подзадачам 2b.8+.
