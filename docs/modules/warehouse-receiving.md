# Модуль: warehouse-receiving
**Статус:** UI `в роботі` · Логіка `в роботі` · Бек `в роботі` · БД `в роботі`
**Маршрут:** /warehouse/receiving (список), /warehouse/receiving/[id] (перегляд/редагування планового або фактичного), /warehouse/receiving/new?type=planned|actual (створення)
**Оновлено:** 2026-08-04

## Призначення
Приймання надходження товару на склад — з картки складу (`/warehouse`, кнопка «Надходження») або напряму.

**`/warehouse/receiving` — список документів.** KPI-картки, кнопки «Планове»/«Швидке надходження», фільтри (дата від-до через `DatePicker`-календар/постачальник/номер/№ видаткової/статус), таблиця з реальними даними (`listReceivingDocuments`). Групує планове→фактичне парою — стрілка-конектор (`CornerDownRight`) + підпис «на основі №…» + суцільна кольорова риска зліва вздовж обох рядків (`border-l-2 border-l-accent-foreground/50` на комірці номера, спільний тінт фону), коли `actual.basedOnId === planned.id`. «Номер документа» — клік → `/warehouse/receiving/[id]`. Колонка «Дії»: Копіювати/Друк/Експорт (заглушки), **Прийняти на склад** і **Видалити** — реальні й лише для `type=planned` (фактичне видалити не можна — пряма вказівка людини).

**Гочта групування (виправлено):** список сортований за `createdAt DESC`, а фактичне завжди створюється ПІЗНІШЕ планового — тож фактичне завжди йде ПЕРЕД своїм плановим у списку. Перша версія `groupDocuments()` шукала пару від планового («хто на мене посилається»); на момент, коли цикл доходив до планового, фактичне вже було відвідане раніше й помилково позначене як одиночний рядок (`consumed`) — пара губилась, стрілка не показувалась (ловила людина на реальних даних). Виправлено: пошук пари тепер від фактичного до його планового за прямим `id`-посиланням (`docs.find(d => d.id === doc.basedOnId)`) — коректно незалежно від порядку.

**Колір типу й статусу в списку** (`lib/types/receiving.ts`): тип — Планове жовтим, Фактичне зеленим (`RECEIVING_DOC_TYPE_BADGE`). Статус — не сирий `status`-enum документа, а похідний від реального співвідношення замовлено/прийнято по позиціях (`computeReceivingDocDisplayStatus`, агрегат рахує `listReceivingDocuments` окремим `GROUP BY document_id`): «Очікується поставка» (жовтий), «Прийнято повністю» (зелений), «Розбіжність в плюс» (синій), «Розбіжність в мінус» (червоний), «Є непланові товари» (фіолетовий — є позиція з `ordered=0`, додана понад план). Синій/фіолетовий — єдині кольори поза палітрою `design.md`, Tailwind напряму (`blue-*`/`purple-*`), без нового CSS-токена.

**«Прийняти на склад»** (кнопка в списку і в шапці планового документа, `PlannedReceivingHeader`) — реальна дія: `createActualReceivingFromPlannedAction` створює новий документ `type=actual`, `basedOnId` на плановий, копіює шапку (постачальник/склад/документ постачальника/ЕН — **не** копіює дату/відповідального/коментар, вони для факту вводяться заново) і всі позиції (`ordered` як у плані, `received=0`), відкриває новий документ.

**`/warehouse/receiving/[id]` і `/warehouse/receiving/new?type=planned|actual`** — обидва типи тепер ведуть через один оркестратор `PlannedReceivingWorkspace` + одну презентаційну таблицю `PlannedReceivingItemsTable` (проп `mode`), з реальними позиціями (не лише заголовком):

| | Планове (`mode="planned"`) | Фактичне (`mode="actual"`) |
|---|---|---|
| «Замовлено» | редаговане | **read-only** (успадковане з плану) |
| «Прийнято» | **read-only**, завжди 0 (нічого не прийнято проти самого плану) | редаговане — реальна прийнята кількість |
| Товари понад план | так, вільно (`AddSkuCombobox`/скан) | так, вільно (пряме рішення людини — постачальник міг прислати щось додатково) |
| Сканування (Enter у пошуку) | збільшує «Замовлено» | збільшує «Прийнято» **і одразу поповнює `product_skus.stock`** |
| «Прийняти на склад» у шапці | є | нема (документ і є результатом приймання) |
| «Підсумок» | Позицій/Очікується | Позицій/Очікується/Прийнято/Розбіжностей |

Позиції — реальна таблиця `receiving_document_items` (join `product_skus`+`products`, без денормалізації, `db.md`). Чекбокс-виділення + «Видалити обрані» — масове видалення, реальне (server actions), не лише локальний фільтр. Кожна дія над позицією (скан/додати/редагувати кількість/видалити) — свій server action, редагування кількості — debounce ~500мс (як заголовок), решта — миттєво. Сервер-гард (не лише UI): зміна «Замовлено» ігнорується, якщо документ не `planned`; зміна «Прийнято» — якщо не `actual`.

Спільне для обох типів: реальний пошук/скан SKU (`AddSkuCombobox`+сканування → `listProductSkusCatalog`, фото+ШК з `product_color_photos`, лайтбокс на клік), звуковий сигнал скану (`playScanBeep`, Web Audio, без залежностей), ЕН-блок (Нова пошта/Укрпошта, `TtnInput`, необов'язково), довільні поля людини («+ Додати поле» → `receiving_document_custom_fields`), автозбереження заголовка після першого «Зберегти».

**`/warehouse/receiving/new?type=actual` — окрема, свідомо не займана мок-гілка** (`ReceivingFormHeader.tsx`/`ReceivingItemsTable.tsx`/`ReceivingInfoForm.tsx`/`SaveReceivingButton.tsx`, `lib/mocks/receiving.ts`): пряме рішення людини не чіпати — лишається досяжною окремо від «Прийняти на склад», без реального бекенду, «Зберегти» нічого не зберігає.

## Файли
| Шлях | Роль |
|---|---|
| src/app/warehouse/receiving/page.tsx | список, `listReceivingDocuments` |
| src/app/warehouse/receiving/actions.ts | `deleteReceivingDocumentAction`, `createActualReceivingFromPlannedAction` |
| src/app/warehouse/receiving/[id]/page.tsx | `getReceivingDocument`+`listReceivingCustomFields`+`listReceivingDocumentItems`, рендерить `PlannedReceivingWorkspace` з `documentType={document.type}` |
| src/app/warehouse/receiving/new/page.tsx | `type=planned` → `PlannedReceivingWorkspace` (порожній, створення); `type=actual` → стара мок-гілка |
| src/app/warehouse/receiving/new/actions.ts | Server Actions документа/кастомних полів/**позицій**: `upsertReceivingDocumentItemAction`, `updateReceivingDocumentItemOrderedAction`, `updateReceivingDocumentItemReceivedAction`, `deleteReceivingDocumentItemAction(s)` |
| src/server/data/receiving.ts | `receiving_documents`/custom fields CRUD, `listReceivingDocuments` (+ агрегати ordered/received/hasUnplanned), `createActualReceivingFromPlanned`, гап-стійка генерація номера (нижче) |
| src/server/data/receiving-items.ts | `receiving_document_items` CRUD: `listReceivingDocumentItems`, `upsertReceivingDocumentItem` (скан/додати, `ON CONFLICT DO UPDATE`), `update{Ordered,Received}` (з сервер-гардом за типом документа), `delete(s)` — усі зі стороннім ефектом на `product_skus.stock`, де стосується `received` |
| src/server/db/schema/receiving.ts | схема, деталі — `db.md` |
| src/server/data/product-skus.ts | `listProductSkusCatalog` (+`barcode`/`photoUrl`) і винесений `buildPhotoLookup` (спільний з `receiving-items.ts`) |
| src/components/warehouse/receiving/PlannedReceivingWorkspace.tsx | оркестратор обох типів (`documentType` проп) — стан, персистенція заголовка/позицій/кастомних полів, «Прийняти на склад» |
| src/components/warehouse/receiving/PlannedReceivingHeader.tsx | шапка — «Зберегти» + умовне «Прийняти на склад» (лише planned) |
| src/components/warehouse/receiving/PlannedReceivingItemsTable.tsx | презентаційна таблиця товарів, `mode`-залежні колонки, сама нічого не персистує |
| src/components/warehouse/receiving/PlannedReceivingInfoForm.tsx | форма — ЕН, кастомні поля |
| src/components/warehouse/receiving/AddSkuCombobox.tsx | пошуковий комбобокс реального SKU |
| src/components/warehouse/receiving/ReceivingFormHeader.tsx, ReceivingItemsTable.tsx, ReceivingInfoForm.tsx, SaveReceivingButton.tsx | лише стара мок-гілка `type=actual` (`/new`) |
| src/components/warehouse/receiving/ReceivingDocumentsTable.tsx | список — фільтри, групування, кольори типу/статусу, «Прийняти на склад»/«Видалити» |
| src/components/warehouse/receiving/ReceivingSummary.tsx, ReceivingQuickActions.tsx | спільні дрібні картки |
| src/lib/types/receiving.ts | `ReceivingItem` (+`productSkuId`), `ReceivingDocumentListItem` (+агрегати), `computeReceivingDocDisplayStatus`, усі мапи підписів/кольорів |
| src/lib/date-ua.ts | `parseUaDate`/`formatTodayUa`/`formatDateUa` |
| src/lib/warehouse/scan-beep.ts | `playScanBeep` |
| src/components/ui/{date-input,date-picker,calendar,ttn-input}.tsx | маски/пікери, `ui-kit.md` |

## Дані
`receiving_documents`/`receiving_document_custom_fields`/`receiving_document_items` — реальні, деталі й мультитенантність (усі запити `WHERE tenant_id`, `tenantId` лише з `getDevTenantId()` на сервері) — `db.md`. Список і форма для обох типів — реальні. `type=actual` через `/new` (не через «Прийняти на склад») — досі мок, свідомо не займали.

## Доступ
Ролі, яким доступний модуль: owner (поки єдина активна роль).

## Зв'язки
Залежить від: `server/data/{warehouses,suppliers,product-skus,receiving,receiving-items}.ts`, `ui/{select,date-input,date-picker,calendar,ttn-input,combobox,badge,dialog,checkbox}`, `layout/HeaderActions`
Від нього залежать: — («Надходження» на картці складу веде на список із `?warehouseId=`)

## Зроблено
- 2026-08-04 (восьмий прохід) — реальні позиції для обох типів (`receiving_document_items`, міграція `0046`): «Прийняти на склад» тепер справді копіює план в новий фактичний документ; «Замовлено»/«Прийнято» — редаговане чи read-only залежно від типу; `product_skus.stock` реально поповнюється при прийманні (і відкочується при видаленні/зменшенні). Похідний кольоровий статус/тип у списку. Знайдено й виправлено гочту генерації номера документа (`db.md`) під час прямої перевірки на реальній БД — усі сценарії (upsert/guard/accept/stock delta/rollback) пройшли.
- 2026-08-04 (сьомий прохід) — `DatePicker`/`Calendar` замість голого `DateInput` у фільтрах списку; чекбокси в таблиці позицій.
- 2026-08-04 (шостий прохід) — `/warehouse/receiving/[id]`, колонка «Дії» з іконками.
- 2026-08-04 (п'ятий прохід) — список переведено на реальні дані, мок-файл видалено.
- 2026-08-04 (перший–четвертий прохід) — форма планового надходження, реальний бекенд заголовка, SKU-каталог, ЕН, кастомні поля.

## Відкрито
- [ ] Живий перегляд у браузері людиною — перевірено HTTP-рендером і прямими DB-скриптами (усі сценарії проходу восьмого пройшли), не інтерактивно (нема headless-браузера в сесії): скан/beep/лайтбокс/чекбокси не клікав
- [ ] `type=actual` через `/warehouse/receiving/new?type=actual` — досі мок, окремо від реального «Прийняти на склад»; свідомо не займали
- [ ] «Друк етикеток», «Надіслати постачальнику», «Дублювати документ», «Копіювати»/«Друк»/«Експорт» (список) — заглушки
- [ ] Множинні фактичні приймання з одного планового (часткові поставки) — зараз `groupDocuments()` у списку показує пару 1:1, другий `actual` з тим самим `basedOnId` не матиме пари в UI (дані самі по собі коректні)
- [ ] У БД лишились тестові документи від скриптів-перевірки (`RCV-2026-002/003/004`) — не заважають, чесний dev-сміттьовий слід
- [ ] Гочта генерації номера (`count()` замість `MAX()`, ретрай в одній транзакції) — та сама помилка потенційно є в `generateWarehouseCode`/`createWarehouse`/`createSku` (`server/data/warehouses.ts`/`product-skus.ts`), там просто ще не траплялась дірка від видалення; не займав, окремий модуль
