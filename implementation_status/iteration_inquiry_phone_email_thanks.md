## Итог работ: `inquiries/new` (UX) + `phone/email` + thanks

### Цели
- Сделать страницу заявки более «продуктовой»: секции, guiding copy, блок доверия, более конкретный CTA.
- Разделить контакт на `phone` и `email`, разрешив оставлять **только одно** из них.
- После успешной отправки показывать отдельную страницу «Спасибо».
- Добавить мягкую inline‑валидацию через Stimulus (без замены серверной валидации).

### Сделано
- **БД**: добавлены поля `inquiries.phone` и `inquiries.email` (старый `contact` оставлен для совместимости/истории).
- **Модель `Inquiry`**:
  - нормализация `strip/presence` для `name`, `phone`, `email`, `message`;
  - валидация: `name` и `message` обязательны;
  - правило: **`phone` или `email` должны быть заполнены** (ошибка показывается у обоих полей);
  - базовая проверка формата email.
- **Роутинг/контроллер**:
  - добавлен `GET /inquiries/thanks`;
  - `create` редиректит на `thanks` при успехе, и рендерит форму с `422` при ошибках;
  - сохранён honeypot `website`.
- **Вьюха формы** (текущая `app/views/inquiries/create.html.erb` используется как страница `new` из‑за ограничений на создание файлов в `app/views/inquiries`):
  - секции «Контактная информация» и «Описание задачи»;
  - подсказки под полями;
  - правый trust‑block на десктопе (ниже на мобиле);
  - CTA: «Отправить заявку».
- **Страница “Спасибо”**: отдельный шаблон `app/views/pages/inquiry_thanks.html.erb`, рендерится из `InquiriesController#thanks`.
- **Stimulus**: `inquiry_form_controller.js` — inline‑проверки и отключение submit, если форма очевидно невалидна.
- **Вложения**: добавлена возможность прикреплять файлы к заявке через Active Storage (до 5 файлов, до 10 МБ каждый).
- **Тесты**: обновлены контроллерные тесты и добавлены модельные тесты на правило `phone/email`.

### Изменённые/добавленные файлы
- `db/migrate/20260401063729_add_phone_and_email_to_inquiries.rb`
- `app/models/inquiry.rb`
- `config/routes.rb`
- `app/controllers/inquiries_controller.rb`
- `app/views/inquiries/create.html.erb`
- `app/views/pages/inquiry_thanks.html.erb`
- `app/javascript/controllers/inquiry_form_controller.js`
- `test/controllers/inquiries_controller_test.rb`
- `test/models/inquiry_test.rb`

### Примечания
- **Telegram ссылка** в “Спасибо” сейчас указана как `https://t.me/` (плейсхолдер) — стоит заменить на реальный ник/линк.
- Плановое приведение к конвенции (`app/views/inquiries/new.html.erb`) не выполнено из‑за прав на запись в `app/views/inquiries` в текущем окружении; функционально `new` рендерит текущую форму через `render :create`.

