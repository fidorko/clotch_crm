# Модуль: settings — піддокумент «Склади»

Частина модуля `settings` (`docs/modules/settings.md`) — винесено окремо за тим самим правилом, що «Постачальники»/«Довідники» (`CLAUDE.md`, розділ 0). Статус/доступ/зв'язки — спільні з `settings.md`, тут немає власного запису в `map.md`.

**Маршрут:** /settings?tab=warehouses, /settings/warehouses/new, /settings/warehouses/[id]

## Призначення
Розділ «Склади» (сайдбар → Налаштування → Склади) — свій tab, сиблінг «Довідників», не вкладений у них. Список (`WarehousesTab`) + форма (`WarehouseForm`, за зразком-скріном людини) з двома вкладками: **«Основні налаштування»** (як і раніше — перемикач «Застосовувати адресне зберігання» тут же, `useBinLocations`) і **«Адресне зберігання»** (друга — лише коли склад уже існує).

**2026-08-03 (третій прохід) — «Структура адрес» злита в «Структура комірок», усе автозберігається одразу.** Пряма вказівка людини: окрему картку «Адресне зберігання» (перемикач-дублікат + «Дозволити повторний друк») і картку «Структура адрес» (назви/формати/роздільник, явний «Зберегти») прибрано повністю. Вся вкладка тепер — лише `WarehouseBinExplorer`:
- назва рівня («Вулиці»/«Стелажі»/«Комірки») — редагується прямо в заголовку колонки, перегляд+олівчик (`EditableTextRow`), автозбереження одразу;
- формат/зразок — потрібен лише для масового створення («Додати декілька»: поле формату + поле кількості разом), запам'ятовується у складі після кожного використання;
- одиничне створення («+») — довільна назва вводиться прямо в рядку таблиці (без формату/послідовності);
- роздільник адреси прибрано з налаштувань — фіксований пробіл (`composeBinCode`, погоджено з людиною).

**2026-08-03 (другий прохід) — ручна 3-колонкова структура замість bulk-генератора.** Старий крос-добутковий генератор (`WarehouseBinGenerationWizard` із dry-run) і фейковий макет-прев'ю (`WarehouseBinLabelPreview`) прибрано повністю — замінено на `WarehouseBinExplorer` (3 колонки Вулиці→Стелажі→Комірки) з видаленням на кожному рівні (каскадно) і реальним друком PDF зі справжнім Code128.

## Файли
| Шлях | Роль |
|---|---|
| src/server/db/schema/warehouses.ts | таблиця `warehouses`, `warehouseTypeEnum`, `WarehouseWorkHourEntry` (jsonb). `bin_level{1,2,3}_name` (назва рівня, редагується інлайн у колонці) + `bin_level{1,2,3}_format` (запам'ятований зразок для масового створення). `bin_separator`/`bin_allow_label_reprint` і колонки старого bulk-генератора — прибрано (нема кому їх споживати) |
| src/server/db/schema/warehouse-bin-locations.ts | 3 таблиці батько→нащадок (той самий принцип, що `size_types`/`size_values`): `warehouse_bin_streets` (`value`, `UNIQUE(tenant_id, warehouse_id, value)`), `warehouse_bin_racks` (`street_id` FK cascade, `UNIQUE(tenant_id, street_id, value)`), `warehouse_bin_cells` (`rack_id` FK cascade, `code`+`barcode` — повна складена адреса, `UNIQUE(tenant_id, rack_id, value)` + `UNIQUE(tenant_id, warehouse_id, code)`). Видалення каскадне через `ON DELETE CASCADE` у ланцюжку |
| src/lib/warehouse/bin-address.ts | чиста логіка адресації (без БД/React) — `generateLevelSequence` (парсить зразок формату), `composeBinCode` (фіксований пробіл між рівнями, без налаштування), **`nextSequenceValues`** (наступні N вільних значень рівня — розширює вікно пошуку, коректно й після видалень-з-дірками чи довільних вручну введених значень) |
| src/server/data/warehouses.ts | (як і раніше) + `updateWarehouseBinLevelName` (назва рівня, одне поле за раз — перегляд+олівчик у колонці), `updateWarehouseBinLevelFormat` (запам'ятовує останній використаний формат після кожного масового створення) |
| src/server/data/warehouse-bin-locations.ts | `listStreets`/`listRacks`/`listCells`; `createStreets`/`createRacks`/`createCells` (масове, `nextSequenceValues` за форматом); `createStreetWithValue`/`createRackWithValue`/`createCellWithValue` (одиничне, довільний текст напряму, дружня помилка на дублікат — `friendlyDuplicateError`); `deleteStreet`/`deleteRack`/`deleteCell`; `countStreetDescendants`/`countRackDescendants` (попередження перед видаленням); `resolveCellsForPrint` |
| src/server/warehouse/bin-label-pdf.ts | `buildBinLabelsPdf` — PDF `pdf-lib`, сторінка 101×101мм, по 5 комірок на сторінку (18мм кожна, розділені лінією), справжній Code128 (`bwip-js/node`) |
| src/app/api/warehouses/[id]/bin-print/route.ts | POST route handler: тіло `{streetIds?, rackIds?, cellIds?}`, `tenantId` — з `getDevTenantId()`; порожній результат → 400; інакше PDF `inline` |
| src/app/settings/warehouses/bin-locations-actions.ts | Server Actions: `updateBinLevelNameAction`, `listRacksAction`/`listCellsAction`, `createStreetsAction`/`createRacksAction`/`createCellsAction` (масове — попутно зберігає формат), `createStreetSingleAction`/`createRackSingleAction`/`createCellSingleAction` (одиничне), `deleteStreetAction`/`deleteRackAction`/`deleteCellAction`, `countStreetDescendantsAction`/`countRackDescendantsAction` |
| src/app/settings/warehouses/actions.ts | Server Actions: `createWarehouseAction`, `updateWarehouseAction`, `deleteWarehouseAction` |
| src/app/settings/warehouses/new/page.tsx, [id]/page.tsx | Server Components — тягнуть довідник «Країни», `currencies`, `listStreets`, рендерять `WarehouseForm`; `[id]` — `notFound()` |
| src/components/settings/WarehousesTab.tsx | список у `?tab=warehouses` |
| src/components/settings/WarehouseForm.tsx | форма (Client Component) — `Tabs`, друга вкладка лише якщо `warehouse` не `null`. Вкладка «Основне» — перемикач `useBinLocations` («Застосовувати адресне зберігання») лишається тут, єдине місце ввімкнення/вимкнення |
| src/components/settings/WarehouseBinLocationsTab.tsx | вкладка «Адресне зберігання» — тепер лише `WarehouseBinExplorer` + текстова підказка, якщо `useBinLocations` вимкнено («Увімкніть на вкладці «Основні налаштування»») |
| src/components/settings/WarehouseBinExplorer.tsx | 3-колонковий стан: `level{1,2,3}Name` (локально + автозбереження), `streets` (з пропу сторінки), `activeStreetId`+`racks` (підвантажено при активації), `activeRackId`+`cells`. `printBinLabels` — `fetch` POST на `bin-print` → blob → `window.open` |
| src/components/settings/WarehouseBinColumn.tsx | узагальнена колонка (3 використання — правило 9.2 CLAUDE.md): заголовок `EditableTextRow` (перегляд+олівчик), блок «Додати декілька» (формат+кількість), «+» (одиничне — відкриває `NewBinItemRow`, довільний текст напряму в списку), «Друкувати обрані», рядки **[значення][чекбокс][кошик]** (порядок за прямою вказівкою людини — значення ліворуч від чекбоксу) |
| src/components/settings/WarehouseFormHeader.tsx | той самий каркас, що `CategoryFormHeader` |
| src/components/settings/WarehouseWorkHoursField.tsx | довільна кількість груп днів |
| src/lib/constants/warehouse-options.ts | `WAREHOUSE_TYPE_OPTIONS` |
| src/lib/types/warehouse.ts | `WarehouseFormInput`, `WarehouseWorkHourInput` |
| src/lib/types/warehouse-bin.ts | `BinPrintSelection` (усе інше — `WarehouseBinConfigInput` тощо — прибрано, немає більше збірної конфігурації) |

## Дані
Таблиця `warehouses`, тенант-скоуповано, RLS. Країна/валюта — копія значення на момент вибору, не FK. Телефон — нормалізований `+380XXXXXXXXX`. 3 таблиці `warehouse_bin_streets`/`racks`/`cells` — батько→нащадок, `ON DELETE CASCADE` у ланцюжку від `warehouses`. Деталі колонок — `db.md`.

**Усе автозберігається одразу (типове правило, conventions.md)** — назва рівня, формат (при масовому створенні), створення/видалення вузлів. Попередній «свідомий виняток» (явне «Зберегти» перед можливою масовою генерацією) — знято цим проходом: причина винятку («перед потенційно тисячами рядків») зникла разом зі старим bulk-генератором, кожна дія в `WarehouseBinExplorer` тепер стосується одного конкретного вузла чи явно вказаної партії, не прихованого крос-добутку.

**Прибрано цим проходом:** картка «Адресне зберігання» (дубльований перемикач `useBinLocations` — лишився тільки на вкладці «Основне» — і чекбокс «Дозволити повторний друк», який ніде не використовувався функціонально); картка «Структура адрес» як окрема сутність (злита в колонки); роздільник адреси як налаштування (фіксований пробіл).

## Доступ
Ролі, яким доступний модуль: owner (поки єдина активна роль).

## Зв'язки
Залежить від: `reference_items` (довідник «Країни»), `currencies` (довідник валют), `PhoneInput`/`Checkbox`/`RadioGroup`/`Switch`/`Dialog`/`Table`/`EditableTextRow` (ui-kit), `bwip-js`/`pdf-lib` (нові залежності, погоджено — `decisions.md`)
Від нього залежать: — (склад/комірка ще ніде не використовуються як зв'язок)

## Зроблено
- 2026-08-03 (третій прохід) — «Структура адрес» злита в «Структура комірок» за прямою вказівкою людини: назва рівня редагується інлайн (`EditableTextRow`, перегляд+олівчик), формат живе лише в блоці масового створення (запам'ятовується після використання, підпис поля — «Введіть назву», кнопка — «Створити декілька», обидва поля однакової ширини), роздільник прибрано (фіксований пробіл), одиничне створення — «+» прямо в списку (не в заголовку колонки) відкриває поле вводу довільного тексту напряму в рядку. Рядки колонки перевпорядковано: значення ліворуч від чекбоксу. Уся вкладка тепер автозберігається одразу, без картки-конфігурації й кнопки «Зберегти». `tsc`/`eslint` чисто — підтверджено людиною живою перевіркою в браузері.
- 2026-08-03 (другий прохід) — «Адресне зберігання» переведено з bulk-генератора на ручну 3-колонкову структуру (`WarehouseBinExplorer`/`WarehouseBinColumn`): створення вулиці/стелажа/комірки по одній чи партією, видалення на всіх трьох рівнях із каскадним попередженням про кількість нащадків, друк реальних етикеток PDF (101×101мм, 5 комірок по 18мм, справжній Code128 через `bwip-js`). Схема БД замінена на 3 таблиці батько→нащадок.
- 2026-08-03 — перший прохід за зразком-скріном людини: таблиця+CRUD+форма складу. Перевірено живою перевіркою в браузері (Playwright): створення складу (код `WH-0001`), маска телефону, «Час роботи».

## Відкрито
- [ ] Реальний перегляд/пошук усіх комірок складу одразу (не по одному стелажу за раз через `WarehouseBinExplorer`) — окремий екран/таблиця не робили, не просили
- [ ] Товари/залишки/замовлення ще не прив'язані до конкретної комірки — `warehouse_bin_cells` поки самостійна довідникова таблиця
- [ ] «Час роботи» — довільний jsonb-список, без валідації перетину інтервалів чи порядку днів
- [ ] `tenant_id` — тимчасово з dev-константи (`TODO(auth)`), як і решта модуля
