# Модуль: settings — піддокумент «Склади»

Частина модуля `settings` (`docs/modules/settings.md`) — винесено окремо за тим самим правилом, що «Постачальники»/«Довідники» (`CLAUDE.md`, розділ 0). Статус/доступ/зв'язки — спільні з `settings.md`, тут немає власного запису в `map.md`.

**Маршрут:** /settings?tab=warehouses, /settings/warehouses/new, /settings/warehouses/[id]

## Призначення
Розділ «Склади» (сайдбар → Налаштування → Склади) — свій tab, сиблінг «Довідників», не вкладений у них. Список (`WarehousesTab`) + форма (`WarehouseForm`, за зразком-скріном людини) з вкладкою «Основні налаштування» (далі планується більше вкладок — інфо-банер у формі вже натякає на майбутню структуру комірок/штрихкоди). Автозбереження наявного складу (conventions.md), явна кнопка «Створити склад» лише на `/new`.

## Файли
| Шлях | Роль |
|---|---|
| src/server/db/schema/warehouses.ts | таблиця `warehouses`, `warehouseTypeEnum` (main/pos/returns/defective/disposal/production), `WarehouseWorkHourEntry` (jsonb) |
| src/server/data/warehouses.ts | `listWarehouses`, `getWarehouseById`, `createWarehouse` (код `WH-0001...`, ретрай на `23505`, той самий патерн, що `generateSupplierCode`), `updateWarehouse`, `deleteWarehouse` |
| src/app/settings/warehouses/actions.ts | Server Actions: `createWarehouseAction`, `updateWarehouseAction`, `deleteWarehouseAction` |
| src/app/settings/warehouses/new/page.tsx, [id]/page.tsx | Server Components — тягнуть довідник «Країни» (`reference_items`, kind `countries`) і `currencies`, рендерять `WarehouseForm`; `[id]` — `notFound()` |
| src/components/settings/WarehousesTab.tsx | список у `?tab=warehouses` (у `settings/page.tsx`, `WarehousesSection`) — таблиця назва/код/тип/статус, «+Додати склад», олівець+кошик (`Dialog`-підтвердження) |
| src/components/settings/WarehouseForm.tsx | форма (Client Component): ліва картка «Основні дані» (назва, код — read-only до генерації, тип — `Select`, статус — `RadioGroup` Активний/Не активний, матеріально відповідальна особа + телефон — `PhoneInput`, адреса: країна `Select` з реального довідника/місто/вулиця); права картка «Коротко про склад» (інфо-банер, примітки, `WarehouseWorkHoursField`, валюта обліку — `Select` з реальних `currencies`, 3 чекбокси — можна продавати/від'ємні залишки/адресне зберігання) |
| src/components/settings/WarehouseFormHeader.tsx | той самий каркас, що `CategoryFormHeader` — крихти + `HeaderActions`, назва + дія(ї)/статус автозбереження |
| src/components/settings/WarehouseWorkHoursField.tsx | довільна кількість груп днів (не 7 фіксованих колонок) — лейбл + `type="time"` від/до + чекбокс «Вихідний» (ховає час, показує задизейблений напис) + кошик, «+Додати» знизу |
| src/lib/constants/warehouse-options.ts | `WAREHOUSE_TYPE_OPTIONS` (6 типів, UA-лейбли) |
| src/lib/types/warehouse.ts | `WarehouseFormInput`, `WarehouseWorkHourInput` |

## Дані
Таблиця `warehouses`, тенант-скоуповано, RLS. Країна/валюта — копія значення (текст/код) на момент вибору, не FK на `reference_items`/`currencies` — той самий принцип, що `colors`→`product_skus` і `suppliers.country` (db.md): видалення довідникового значення заднім числом не ламає вже створений склад. Телефон — нормалізований `+380XXXXXXXXX` (conventions.md, «Формати вводу»). Деталі колонок — `db.md`.

## Доступ
Ролі, яким доступний модуль: owner (поки єдина активна роль).

## Зв'язки
Залежить від: `reference_items` (довідник «Країни»), `currencies` (довідник валют), `PhoneInput`/`Checkbox`/`RadioGroup` (ui-kit)
Від нього залежать: — (склад ще ніде не використовується як зв'язок — товари/залишки/замовлення поки не прив'язані до конкретного складу)

## Зроблено
- 2026-08-03 — перший прохід за зразком-скріном людини: таблиця+CRUD+форма з полями за прямим текстовим списком людини (пріоритет над зображенням там, де вони розійшлись — зображення дало лише структуру розмітки, не остаточний список полів: без Email/Індексу/Області, «Матеріально відповідальна особа» — лише в лівій колонці, без дублю-селекта праворуч). Перевірено живою перевіркою в браузері (Playwright): створення складу (код `WH-0001` згенеровано), маска телефону (`+380 67 123 45 67`), рядок «Час роботи» — усе коректно збереглося й перечиталося з БД після рефрешу; список і видалення (з `Dialog`-підтвердженням) — без помилок консолі.

## Відкрито
- [ ] Більше вкладок форми складу (структура комірок, друк етикеток зі штрихкодами — натякнуто інфо-банером) — не просили, не робили
- [ ] Товари/залишки/замовлення ще не прив'язані до конкретного складу — `warehouses` поки самостійна довідникова таблиця
- [ ] «Час роботи» — довільний jsonb-список, без валідації перетину інтервалів чи порядку днів
- [ ] `tenant_id` — тимчасово з dev-константи (`TODO(auth)`), як і решта модуля
