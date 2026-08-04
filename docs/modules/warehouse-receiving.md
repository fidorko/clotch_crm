# Модуль: warehouse-receiving
**Статус:** UI `в роботі` · Логіка `в роботі` (планове — реальний бекенд заголовка) · Бек `в роботі` · БД `в роботі`
**Маршрут:** /warehouse/receiving (список), /warehouse/receiving/[id] (перегляд/редагування планового), /warehouse/receiving/new?type=planned|actual (створення)
**Оновлено:** 2026-08-04

## Призначення
Приймання надходження товару на склад — з картки складу (`/warehouse`, кнопка «Надходження») або напряму.

**`/warehouse/receiving` — список документів, п'ятий-шостий прохід: реальні дані + дії.** KPI-картки, кнопки «Планове»/«Швидке надходження», фільтри, таблиця з групуванням планове→фактичне парою (стрілка-конектор) — усе тепер тягнеться з `receiving_documents` (`listReceivingDocuments`, join `suppliers`/`warehouses` за назвою). Мок-файл (`lib/mocks/receiving-documents.ts`) видалено остаточно (пряма вказівка людини) — типи/мапи підписів статусу-типу переїхали в `lib/types/receiving.ts`, `parseUaDate`/`formatTodayUa`/`formatDateUa` — у `lib/date-ua.ts`. Список читає лише реальні документи тенанта — порожньо, доки нічого не створено (чесний empty state).

**«Номер документа» — клік → `/warehouse/receiving/[id]`** (реальний перегляд/редагування, лише для `type=planned` — єдиний тип, що зараз персистується; `type=actual` дає `notFound()`). Колонка «⋮» замінена на колонку **«Дії»** з іконками: Копіювати/Друк/Експорт — заглушки, **Видалити** — реальне (`deleteReceivingDocumentAction`), **рендериться тільки для планового** (фактичне видалити не можна — пряма вказівка людини, умова `type = 'planned'` просто в SQL `WHERE`, не окрема перевірка).

**`/warehouse/receiving/new?type=planned` — планове надходження, четвертий прохід: реальний бекенд заголовка.** Окремий оркестратор `PlannedReceivingWorkspace` (замінив спільні з `actual` компоненти для цього типу):

- **Перше «Зберегти» створює документ** (`createReceivingDocumentAction` → `receiving_documents`), **кожна наступна зміна поля автозберігається** (debounce ~500мс, без кнопки — той самий принцип, що картка товару, `conventions.md`). Кнопки «Зберегти»/«Прийняти на склад» (перейменована, перенесена в шапку поруч) — `PlannedReceivingHeader`.
- **Товари** (`PlannedReceivingItemsTable`) — реальний пошук/додавання SKU (`AddSkuCombobox` → `listProductSkusCatalog`), колонки: чекбокс (виділити) / № / **Фото** (реальне мініатюрне зображення з `product_color_photos`, клік → `Dialog`-лайтбокс на весь розмір, той самий патерн, що `ProductPhotoGallery`) / SKU / **ШК** (штрихкод SKU) / Назва / Колір / Розмір / Замовлено (редаговане) / Прийнято / Статус / ⋮. Без «Комірка» (не актуально на етапі планування). Чекбокс у заголовку — «виділити всі видимі» (той самий патерн, що `ProductsTable`); «Видалити обрані» — рядок над таблицею, зʼявляється лише коли є виділені; масове видалення — локальний фільтр масиву (позиції ще не персистуються, нема що видаляти на сервері).
- **Сканування штрихкоду** — пошукове поле подвоює роль скан-приймача: Enter — термінатор (стандартна поведінка USB/BT-сканерів під клавіатуру), синхронний пошук у вже завантаженому `skuCatalog` (без мережі/debounce — «максимально швидко», пряма вказівка людини), той самий ШК ще раз → «Замовлено» +1, інший ШК → додається інший товар. «Пік» — `playScanBeep()` (`lib/warehouse/scan-beep.ts`, Web Audio API, без нового пакета/файлу). Кнопка «Сканувати штрихкод» просто фокусує поле.
- **Інформація про надходження** (`PlannedReceivingInfoForm`) — Постачальник/Склад реальні; «Дата план» (замість «Дата надходження»); ЕН — чекбокс-вибір Нова пошта/Укрпошта (взаємовиключний) + `TtnInput` (маска), **необов'язково** (не блокує збереження); **«+ Додати поле»** — людина вводить довільну назву, «Зберегти» створює `receiving_document_custom_fields`-рядок (неявно створює сам документ, якщо його ще нема), значення автозберігається так само дебаунсом; «Відповідальний» — вільний текст (нема таблиці користувачів).
- **Позиції (SKU/кількості) НЕ персистяться** — лише заголовок документа. Items-таблиця — далі клієнтський `useState`, як і раніше.
- «Швидкі дії» — Друк етикеток/Створити товар/Надіслати постачальнику/Дублювати документ (заглушки).

**`/warehouse/receiving/new?type=actual` — швидке/фактичне надходження.** Без змін цим проходом: мок-рядки (`ReceivingItemsTable`/`MOCK_RECEIVING_ITEMS`), «Комірка» є, «Дата надходження», нема ЕН/кастомних полів/автозбереження. «Зберегти» (`SaveReceivingButton`) — лише візуальне підтвердження кліку, без бекенду (нема документа, до якого прив'язатись).

## Файли
| Шлях | Роль |
|---|---|
| src/app/warehouse/receiving/page.tsx | список, тягне `listReceivingDocuments` |
| src/app/warehouse/receiving/actions.ts | Server Action списку: `deleteReceivingDocumentAction` |
| src/app/warehouse/receiving/[id]/page.tsx | перегляд/редагування наявного документа — `getReceivingDocument`+`listReceivingCustomFields`, `notFound()` якщо нема або `type≠planned`, рендерить `PlannedReceivingWorkspace` з `initialValues`/`initialDocumentId`/`initialCustomFields` |
| src/app/warehouse/receiving/new/page.tsx | тягне `listWarehouses`/`listSuppliers`/`listProductSkusCatalog`; `type=planned` → рендерить `PlannedReceivingWorkspace` (порожній, створення), інакше — стара мок-гілка |
| src/app/warehouse/receiving/new/actions.ts | Server Actions: `createReceivingDocumentAction`, `updateReceivingDocumentAction`, `createReceivingCustomFieldAction`, `updateReceivingCustomFieldValueAction`, `deleteReceivingCustomFieldAction` |
| src/server/data/receiving.ts | дані `receiving_documents`/`receiving_document_custom_fields`: CRUD + `listReceivingDocuments` (список, join постачальник/склад, `LIMIT 200`), `getReceivingDocument`, `deleteReceivingDocument` (лише `type='planned'` у WHERE) |
| src/server/db/schema/receiving.ts | схема (розділ вище, `db.md`) |
| src/server/data/product-skus.ts | + `listProductSkusCatalog` (тепер з `barcode`/`photoUrl` — join `product_color_photos` за `(productId,color)`) |
| src/components/warehouse/receiving/PlannedReceivingWorkspace.tsx | оркестратор — увесь стан (документ/поля/позиції/кастомні поля), збереження/автозбереження |
| src/components/warehouse/receiving/PlannedReceivingHeader.tsx | шапка — «Зберегти» (слот з workspace) + «Прийняти на склад» |
| src/components/warehouse/receiving/PlannedReceivingItemsTable.tsx | контрольована таблиця товарів — фото+лайтбокс, ШК, сканування |
| src/components/warehouse/receiving/PlannedReceivingInfoForm.tsx | контрольована форма — ЕН, кастомні поля |
| src/components/warehouse/receiving/AddSkuCombobox.tsx | пошуковий комбобокс реального SKU (спільний для скану й ручного додавання) |
| src/components/warehouse/receiving/ReceivingFormHeader.tsx, ReceivingItemsTable.tsx, ReceivingInfoForm.tsx | лише `type=actual` — спрощені назад до мок-версії без `type`-розгалужень |
| src/components/warehouse/receiving/SaveReceivingButton.tsx | `type=actual` — декоративне «Зберегти» (без бекенду) |
| src/components/warehouse/receiving/ReceivingSummary.tsx, ReceivingQuickActions.tsx | спільні для обох типів |
| src/lib/types/receiving.ts | `ReceivingItem`/`ReceivingItemStatus` (позиції планового) + `ReceivingDocumentListItem`/`ReceivingDocType`/`ReceivingDocStatus`/мапи підписів (список документів) |
| src/lib/date-ua.ts | `parseUaDate`/`formatTodayUa`/`formatDateUa` — спільні для фільтрів списку і KPI |
| src/lib/warehouse/scan-beep.ts | `playScanBeep` — Web Audio, без залежностей |
| src/components/ui/date-input.tsx | + `parseDateInputToIso` (межа УІ↔БД) |
| src/components/ui/ttn-input.tsx | маска ЕН (Нова пошта/Укрпошта) |
| src/lib/mocks/receiving.ts | мок-позиції `type=actual` — не займали цим проходом |

## Дані
`receiving_documents`/`receiving_document_custom_fields` — реальні, деталі й мультитенантність — `db.md`. `product_skus`+`product_color_photos` — реальне джерело позицій/фото/ШК планового (`listProductSkusCatalog`). Список документів (`/warehouse/receiving`) — реальний, `listReceivingDocuments`. Позиції самого планового надходження і весь `type=actual` — досі клієнтський мок.

## Доступ
Ролі, яким доступний модуль: owner (поки єдина активна роль).

## Зв'язки
Залежить від: `server/data/{warehouses,suppliers,product-skus,receiving}.ts`, `ui/{select,date-input,date-picker,calendar,ttn-input,combobox,badge,dialog,checkbox}`, `layout/HeaderActions`
Від нього залежать: — («Надходження» на картці складу веде на список із `?warehouseId=`)

## Зроблено
- 2026-08-04 (сьомий прохід) — фільтри «Дата від»/«Дата до» списку отримали справжній календар-піковер (`DatePicker`/`Calendar`, нові ui-kit, без залежностей) замість голого `DateInput` — пряма вказівка людини. Чекбокси в `PlannedReceivingItemsTable` — виділити/видалити кілька позицій разом (локально, позиції ще не персистуються).
- 2026-08-04 (шостий прохід) — клік по «Номер документа» відкриває `/warehouse/receiving/[id]` (реальний перегляд/редагування планового); колонку «⋮» замінено на «Дії» з іконками, видалення — реальне й лише для планового.
- 2026-08-04 (п'ятий прохід) — список `/warehouse/receiving` переведено на реальні дані (`listReceivingDocuments`), мок-файл `receiving-documents.ts` видалено остаточно (пряма вказівка людини) — типи/утиліти переїхали в `lib/types/receiving.ts`/`lib/date-ua.ts`. Реальний тестовий документ (створений скриптом-перевіркою четвертого проходу) підтверджено видимим на живій сторінці. `tsc`/`eslint` чисто, live-HTTP — 200.
- 2026-08-04 (четвертий прохід) — реальний бекенд заголовка планового надходження: `receiving_documents`/`receiving_document_custom_fields` (нова міграція `0045`), перше «Зберегти» створює, автозбереження після; реальний пошук/скан SKU з фото+ШК (`listProductSkusCatalog` розширено), кастомні поля людини, ЕН необов'язкове. Перевірено прямим скриптом на реальній БД (create/update/custom-field CRUD — усі операції пройшли).
- 2026-08-04 (третій прохід) — планове стало реальним там, де можливо без бекенду: SKU-каталог, ЕН-маска, «Дата план», «Комірка» прибрано **лише з таблиці позицій** (адресне зберігання складу в `settings-warehouses.md` не чіпали), «Швидкі дії» переосмислено.
- 2026-08-04 (другий прохід) — проміжний список документів, групування планове→фактичне.
- 2026-08-04 — перший прохід форми за зразком-скріном людини.

## Відкрито
- [ ] Живий перегляд у браузері людиною — перевірено HTTP-рендером і прямим DB-скриптом, не інтерактивно (нема headless-браузера в сесії): скан/beep/лайтбокс/автозбереження не клікав
- [ ] Позиції (SKU/кількості) планового надходження НЕ персистяться — лише заголовок; після рефрешу сторінки позиції зникнуть
- [ ] `type=actual` (швидке/фактичне) — досі повністю мок, не займав
- [ ] «Прийняти на склад» — поки просто лінк на `?type=actual`, не створює фактичний документ зі звʼязком `based_on_id` на плановий
- [ ] «Друк етикеток», «Надіслати постачальнику», «Дублювати документ», «Копіювати»/«Друк»/«Експорт» (список) — заглушки
- [ ] У БД лишився один тестовий документ (`RCV-2026-002`, статус draft) від скрипта-перевірки — тепер видимий і в списку; можна видалити вручну через `db:studio`, коли знадобиться
