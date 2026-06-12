# Publish check-list

Перед публикацией и после публикации на GitHub Pages проверить, что страница загрузила свежую сборку:

- Внизу справа виден build-маркер.
- После публикации открыть ссылки с новым `v=...` или нажать `Ctrl+F5`.

Автопроверка ролей:

- Локально: `check-roles.bat`
- GitHub Pages: `check-roles.bat --base=https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html`

Базовая ссылка:

`https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html`

## Role checks

| Роль | Ссылка | Проект / спецификация | Техблоки | Лимит расчетов | Добавление в проект | Прокрутка |
|---|---|---|---|---|---|---|
| guest | `?role=guest` | Не видны | Не видны | Есть, 5 расчетов | Нет | Работает |
| user | `?role=user` | Видны, базовый проект | Не видны | Нет | Есть | Работает |
| client | `?role=client` | Видны, сохранение/печать/экспорт доступны | Не видны | Нет | Есть | Работает |
| admin | `?role=admin` | Видны, без ограничений | Видны | Нет | Есть | Работает |

## Детальная проверка

Для каждой роли открыть ссылку:

- `https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html?role=guest&v=check`
- `https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html?role=user&v=check`
- `https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html?role=client&v=check`
- `https://vetvvv.github.io/Calc-square-CAMduct_vvv-v1.0.0/home.html?role=admin&v=check`

Проверить:

1. Проект виден или скрыт согласно таблице.
2. Формулы, замки, раскладка, схемы и внутренние технологии видны только в `admin`.
3. Лимит расчетов есть только в `guest`.
4. Кнопка добавления в проект отсутствует в `guest`, есть в `user/client/admin`.
5. Прокрутка калькулятора работает: компактный калькулятор стоит на месте, раскрытый длинный калькулятор прокручивается в правой панели.

## Notes

Дата проверки:

Build:

Замечания:
