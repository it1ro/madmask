# Итерация 6: Галерея изображений и UI карточки

## Статус

| Подзадача | Результат |
|-----------|-----------|
| Модель | `has_many_attached :gallery_images`; валидации типа (JPEG/PNG/GIF/WebP/AVIF), размер ≤ 5 МБ, максимум 10 файлов; `hero_image`, `gallery_extra_count`, `preview_images_ordered` |
| Админка | `gallery_images: []` в strong params; `purge_requested_gallery_images` по `ActiveStorage::Attachment.find_signed`; форма — multiple upload, чекбоксы удаления по `signed_id` |
| Страница товара | Секция фото сверху (главный кадр + лента миниатюр, `product_gallery` Stimulus); блок 3D ниже; якорь `#product-3d-preview` сохранён |
| Каталог | `hero_image` + вариант превью; бейдж `+N` при `gallery_extra_count > 0`; hover `hover:-translate-y-1.5` |
| Тесты | Расширен `test/models/product_test.rb`; прогон: `docker compose run --rm web bin/rails test` |

## Команды проверки

```bash
docker compose run --rm web bin/rails test
```
