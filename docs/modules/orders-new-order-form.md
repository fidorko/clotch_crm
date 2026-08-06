# Модуль: orders — піддокумент «Форма нового замовлення» (/orders/new)

Частина модуля `orders` (`docs/modules/orders.md`) — винесено окремо за тим самим правилом, що «Доставка» в `settings` (`CLAUDE.md`, розділ 0). Статус/доступ — спільні з `orders.md`, тут немає власного запису в `map.md`.

**Маршрут:** /orders/new

## Призначення
Перший реальний бек модуля «Замовлення». **2026-08-06, другий прохід — повний редизайн за детальним макетом людини**: верхня панель дій, ряд 1 (Клієнт 30% / Товари 70%, однакова висота), ряд 2 (Оплата/Доставка/Підсумок, порівну й однакова висота), ряд 3 (Параметри замовлення / Дати-статус-джерело). **Третій прохід** — друк маркування/ЕН, реальний Поштомат/Адреса як типи доставки НП, реальний вибір пакування, нова формула авто-габаритів («в стос»), опис вантажу рахується сервером, юрособа переїхала в хедер, деталізація «До оплати клієнтом». **Четвертий прохід (той самий день)** — ЕН створюється ОДРАЗУ по кліку (не при сабміті), кнопка «Видалити ЕН», реальний статус ЕН, реальна вартість доставки з уже створеної ЕН, реально розділені Поштомат/Відділення, `OrderSummaryCard` видалено (влито в `OrderParametersCard`), фікс «Разом», **список `/orders` тепер реальний** (не мок), нова картка перегляду `/orders/[id]`.

**Клієнт** — телефон + ПІБ у **3 окремих полях** (Прізвище/Ім'я/По батькові, пряма вказівка людини), email, коментар (`customers.comment`). `createOrGetCustomer` сам знаходить наявного клієнта за нормалізованим телефоном; поле телефону на blur тихо підказує «Постійний клієнт: <ім'я>». «Новий клієнт» — декоративна кнопка (чистить поля), окремого попапу нема.

**Товари** — `ProductSkuCombobox` (пошук за назвою/артикулом/SKU/штрихкодом), «Склад відвантаження» — один `Select` на все замовлення (реальний список `warehouses`, дефолт — `is_primary`), у рядку: фото/артикул(=SKU)/SKU/склад/залишок (`product_skus.stock`, глобальний)/кількість/ціна/**знижка на рядок** (`DiscountInput`, %/сума)/сума. «Додати примітку до товарів» (`orders.items_note`). Up-sell/Cross-sell — чесні заглушки.

**Оплата** — реальний `Select` способів оплати тенанта (`payment_methods`, замінив хардкод `ORDER_PAYMENT_METHOD_OPTIONS`); `kind="partial_payment"` показує суму (реальні варіанти `payment_method_partial_amounts` або ручний ввід). Статус оплати — реальний довідник `payment_statuses` (settings → Довідники → Системні, той самий UI-патерн, що `order_statuses`), дефолт «Очікує оплати».

**Доставка** — радіокнопки способу. Для Нової пошти — усі 3 типи реально працюють: Відділення/Поштомат (пошук `NpSearchCombobox`, **четвертий прохід** — обидва реально фільтруються `TypeOfWarehouseRef`, раніше «Відділення» не фільтрувало нічого й показувало поштомати впереміш)/Адреса (пошук вулиці + номер будинку, `⚠️` гілка `createShipment` не перевірена живим викликом). «Інший отримувач», вага/габарити (**формула «в стос»**, `sumPackageDims`), «Сума післяплати» (read-only). Опис вантажу — read-only прев'ю (`buildShipmentDescription`, авторитетне значення рахує сервер). **Четвертий прохід — ЕН тепер реальна, не відкладена:** «Створити ЕН» викликає `createShipmentNowAction` ОДРАЗУ (не при сабміті замовлення) — номер ЕН і реальна вартість (`costOnSite`, замінює орієнтовну з калькулятора — людина: «порахувало калькулятором не правильно») показуються одразу в картці, окремий тихий виклик `trackShipmentAction` підтягує поточний статус НП. Опис вантажу обрізається до 36 символів (**реальний ліміт НП, `Description: string[36]`** — довший текст НП мовчки ігнорує ціле поле, а не обрізає, звідси й «опис не виводиться» на живому тесті людини — прев'ю в картці показує той самий обрізаний текст). Поки ЕН існує — поля отримувача/ваги/габаритів/пакування заблоковані (`locked`), з'являється кнопка «Видалити ЕН» (`deleteShipmentNowAction`, реальний `InternetDocument.delete`) — знімає блокування. «Пакування» — `DropdownMenu` з `getPackList()`, вартість зашита в «Розрахувати» через `PackRef` (**багфікс четвертого проходу** — раніше помилково `OptionsSeat`, кидало `"OptionsSeat is empty..."`). **«Друк маркування» — реальний одразу після створення ЕН** (пряма вказівка людини), не після сабміту замовлення: `printShipmentNowAction` працює прямо з `ref` (без читання замовлення з БД, воно ще не існує на цьому етапі) — той самий URL-механізм, що `printShipmentDocumentsAction` у `SuccessPanel` (доступний і після збереження, коли `ref` уже читається з `order.carrierShipmentRef`).

**Параметри замовлення** — `Select` юрособи в хедері (не тут). Менеджер/створив (`DEV_USER.name`, `TODO(auth)`), коментар. **Четвертий прохід — тут же тепер знижка на замовлення (`DiscountInput`) + промокод+«Застосувати»** (перенесено з видаленого `OrderSummaryCard`, пряма вказівка людини — «`OrderSummaryCard` не потрібен, дані сюди»). Деталізована картка «До оплати клієнтом»: Сума товарів (після знижки) / Доставка (з пакуванням) / Комісія накладеного платежу / **Разом** (**багфікс четвертого проходу** — раніше «Разом» помилково брав формулу `codAmount`, показувало 0 для будь-якого способу оплати крім накладеного платежу; тепер — сума видимих рядків, завжди).

**Дати/статус/джерело** — дата замовлення/очікувана дата відвантаження (`DatePicker`, дефолт сьогодні), статус замовлення (7 хардкод `OrderStatus`, **авто-дефолт**: `cash_on_delivery` → «Комплектується», інакше «Нове» — виставляється при виборі способу оплати, лишається редагованим вручну), джерело (як і раніше).

**Створення ЕН (`NovaPoshtaProvider.createShipment`, `docs/carriers/novaposhta/shipments.md`)** — **четвертий прохід: викликається ДО створення замовлення** (`createShipmentNowAction`), не після. Відправник — контрагент з `delivery_method_entity_settings` обраної юридичної особи, отримувач — новий контрагент. `ServiceType` — динамічний (`computeServiceType()`, `actions.ts`) з `senderAddressType` × `npType` — 4 реальні комбінації. `CargoType`/`PaymentMethod` — хардкод (`Parcel`/`Cash`). Готовий результат (ttn/ref/costOnSite/дата) записується в замовлення лише при фінальному сабміті (`createOrder`, `server/data/orders.ts`) — не окремим викликом carrier API під час сабміту.

**Розрахунок вартості (`NovaPoshtaProvider.calculate`, ✅)** — `getDocumentPrice`, безпечний для живого тесту. `+ PackRef` (**виправлено четвертим проходом** — раніше помилково `OptionsSeat`), `serviceType` динамічний.

**Видалення ЕН (`NovaPoshtaProvider.deleteShipment`, ✅ реалізовано четвертим проходом)** — `InternetDocument.delete`, реальний побічний ефект (скасовує справжнє відправлення). **Статус ЕН (`NovaPoshtaProvider.track`, ✅ реалізовано четвертим проходом)** — `TrackingDocument.getStatusDocuments`, read-only, викликається одразу після створення ЕН.

**Друк ЕН/маркування (`NovaPoshtaProvider.printDocuments`, ✅ реалізовано третім проходом)** — URL-схема `my.novaposhta.ua/orders/{method}/orders/{ref1,ref2,...}/type/pdf/apiKey/{key}` (сегмент `orders/` без квадратних дужок — виправлено шостим проходом, `orders.md`, `[]` ламає друк кількох ref одночасно). **Восьмий прохід** — провайдер сам робить `fetch()` на цей URL СЕРВЕРНО (apiKey раніше світився в адресному рядку клієнта), повертає base64 PDF; клієнт відкриває через `openPdfBlob()`, `docs/carriers/novaposhta/printing.md`. Кнопки — у `SuccessPanel`, активні лише після успішного створення ЕН у тому самому замовленні.

## Файли
| Шлях | Роль |
|---|---|
| src/app/orders/new/page.tsx | сторінка — тягне склади/способи оплати+суми/статуси оплати/юрособи/entitySettings+каталог SKU |
| src/app/orders/new/actions.ts | `searchCustomersAction`, `createOrderAction` (спрощено, четвертий прохід — без виклику carrier API), `calculateDeliveryCostAction`, `printShipmentDocumentsAction` (пост-сабміт, читає `orderId`), **`createShipmentNowAction`/`deleteShipmentNowAction`/`trackShipmentAction`/`printShipmentNowAction`** (нові, четвертий прохід — усі працюють прямо з `ref`/deliveryMethodId, без БД-замовлення), `computeServiceType()` |
| src/app/orders/[id]/page.tsx | **новий, четвертий прохід** — картка перегляду замовлення (read-only): клієнт/оплата/доставка/товари/параметри, `getOrderDetail()` |
| src/app/orders/page.tsx | **четвертий прохід** — реальний список (`listOrdersForList`), не мок |
| src/components/orders/new/OrderForm.tsx | оркестратор — Select юрособи в хедері, ряд 2 `grid-cols-[1fr_2fr]` (Оплата/Доставка, четвертий прохід — без `OrderSummaryCard`), стан `delivery.shipment` |
| src/components/orders/new/OrderCustomerCard.tsx | клієнт — ПІБ 3 поля, телефон, email, коментар |
| src/components/orders/new/OrderItemsCard.tsx | товари — фото/артикул/SKU/склад/залишок/кількість/ціна/знижка рядка/сума |
| src/components/orders/new/OrderDeliveryCard.tsx | доставка — 3 типи НП, **реальне створення/видалення ЕН одразу** (не при сабміті), статус ЕН, блокування полів поки ЕН існує (четвертий прохід) |
| src/components/orders/new/OrderPaymentCard.tsx | оплата — спосіб/сума часткової/статус (усі реальні) |
| src/components/orders/new/OrderParametersCard.tsx | менеджер/створив/коментар/**знижка+промокод** (четвертий прохід, з видаленого `OrderSummaryCard`)/деталізоване «До оплати клієнтом» (юрособа — в хедері) |
| src/components/orders/new/OrderScheduleCard.tsx | дата замовлення/очікувана дата відвантаження/статус/джерело |
| src/components/orders/new/DiscountInput.tsx | знижка %/сума — спільний контрол (2 використання: рядок товару + параметри) |
| src/lib/orders/discount.ts, package-dims.ts, shipment-description.ts | `applyDiscount()`/`sumPackageDims()`/`buildShipmentDescription()` — чисті спільні функції |
| src/lib/orders/relative-time.ts | **новий, четвертий прохід** — `formatRelativeUa()`, замінив дублікат у видаленому `lib/mocks/orders.ts` |
| src/lib/types/orders.ts | **четвертий прохід** — `OrderListItem.paymentStatus`/`deliveryMethod` тепер реальні `{name,color?}` (не жорсткий enum), `+ carrierKey` (лише для групування «Друк ТТН») |
| src/components/orders/OrderRow.tsx, OrdersFiltersBar.tsx, OrdersTable.tsx, OrdersPageClient.tsx, PrintTtnDialog.tsx, export-csv.ts | **четвертий прохід** — під реальні дані: номер замовлення клікабельний (`/orders/[id]`), фільтр «Оплата» з реального довідника, `carrierKey` замість `deliveryMethod` для групування друку |
| src/server/data/customers.ts | `searchCustomers`, `createOrGetCustomer` |
| src/server/data/orders.ts | `createOrder` пише вже готовий shipment-знімок (не викликає carrier API сам); **нові `listOrdersForList()`, `getOrderDetail()`** (четвертий прохід); `saveOrderShipment` видалено (мертвий код) |
| src/server/data/payment-statuses.ts | CRUD довідника статусів оплати |
| src/server/data/product-skus.ts | `listProductSkusCatalog` — успадковує дефолт пакування від категорії |
| src/server/carriers/carrier.interface.ts | `+ packRef` (`CalculateShipmentInput`), `+ streetRef/houseNumber` (`ShipmentNewRecipient`), **`+ packageLengthCm/WidthCm/HeightCm`** (`CreateShipmentInput`, четвертий прохід — `OptionsSeat`) |
| src/server/carriers/novaposhta/provider.ts | `calculate()` (`PackRef`, виправлено), `createShipment()` (`OptionsSeat` завжди, виправлено), **`deleteShipment()`/`track()`** (нові, четвертий прохід), `getWarehouses()` (дуальний тип+кеш), `printDocuments()` |
| src/components/settings/PaymentStatuses{Tile,FormDialog,List}.tsx | UI довідника «Статуси оплат» |

## Дані
`customers`/`orders`/`order_items`/`payment_statuses` — тенант-скоуповано, RLS. `warehouses.is_primary`. Деталі колонок/індексів — `db.md`.

## Доступ
Ролі: owner (поки єдина активна роль) — той самий, що `orders.md`.

## Зв'язки
Залежить від: `delivery_methods`+`delivery_method_entity_settings`, `payment_methods`+`payment_method_partial_amounts`, `payment_statuses`, `company_legal_entities`, `warehouses`, `product_skus`/`products`, `server/carriers/` (реальний виклик НП: `createShipment`+`calculate`+`deleteShipment`+`track`+`printDocuments`).
Від нього залежать: **список `/orders` і картка `/orders/[id]` (четвертий прохід — раніше читали лише мок)**.

## Зроблено
- 2026-08-06 (**четвертий прохід**) — 10 правок за прямою вказівкою людини + друк маркування одразу після ЕН + 5 живих API-багів, знайдені людиною під час реального тестування: (1) ЕН тепер створюється ОДРАЗУ по кліку «Створити ЕН» (`createShipmentNowAction`), не при сабміті замовлення — номер/вартість (`costOnSite`, реальна замість орієнтовної з калькулятора) одразу в картці; (2) кнопка «Видалити ЕН» (`deleteShipment`, реальний побічний ефект); (3) статус ЕН у Новій пошті одразу після створення (`track`); (4) Поштомат/Відділення реально розділені; (5) «Разом» в `OrderParametersCard` — фікс; (6) `OrderSummaryCard` видалено, знижка/промокод — в `OrderParametersCard`; (7) список `/orders` — реальні дані (`listOrdersForList`), мок видалено; (8) номер замовлення в списку — реальне посилання на `/orders/[id]` (`getOrderDetail`); (9) друк маркування (`printShipmentNowAction`) — доступний одразу після створення ЕН, не лише після сабміту замовлення. **5 живих API-багів**: `calculate()` кидав `"OptionsSeat is empty"` при пакуванні (мало бути `PackRef`) — виправлено; `createShipment()` кидав ту саму помилку для поштомата — там `OptionsSeat` **справді обов'язковий** — додано завжди; **опис зникав** — `Description` має офіційний ліміт `string[36]` (звірено людиною з `developers.novaposhta.ua`), НП мовчки ігнорує ціле поле при перевищенні — тепер обрізається до 36; **опис усе одно не з'являвся в кабінеті НП** — людина знайшла реальне ОКРЕМЕ поле `AdditionalInformation` (те, що показується як «Додаткова інформація про відправлення»), тепер надсилається обидва поля; **накладений платіж не додавався** — `codAmount` рахувався лише для показу, реально в `save` не потрапляв — тепер `BackwardDeliveryData` (`{PayerType, CargoType:"Money", RedeliveryString}`), рахується сервером незалежно від клієнта. `tsc`/`eslint` чисто.
- 2026-08-06 (третій прохід) — друк ЕН/маркування, реальний Поштомат/Адреса/пакування, формула габаритів «в стос», опис вантажу з налаштувань, юрособа в хедері, деталізація «До оплати клієнтом». Побічний баг-фікс: успадкування дефолтів пакування від категорії (`product-skus.ts`). Міграція `0066` (5 nullable-колонок `orders`).
- 2026-08-06 (другий прохід) — повний редизайн за детальним макетом людини, юрособа обов'язкова, статуси оплати, знижки, дати, вага/габарити персистентні, реальний `calculate()`.
- 2026-08-06 — перший прохід: реальні таблиці + форма + реальне `InternetDocument.save`.

## Відкрито
- [x] `createShipment` — підтверджено людиною живим тестом (ЕН створено, опис і накладений платіж реально з'явились після виправлення `OptionsSeat`/`Description`/`AdditionalInformation`/`BackwardDeliveryData`)
- [ ] Гілка «Адреса»-отримувача (`Doors`, `RecipientAddressName`/`BuildingNumber`) — найменш перевірена частина `createShipment`, лише за документацією
- [ ] `deleteShipment()`/`track()` — реалізовані, живим викликом із реальним номером ЕН ще не перевірені
- [x] URL-схема друку (`my.novaposhta.ua/orders/...`) — перевірено прямими живими запитами (шостий прохід, `orders.md`): сегмент `orders[]/` (з дужками) ламався на кількох ref, виправлено на `orders/`; підтверджено валідними PDF (1/2/3 сторінки)
- [ ] `CargoType`/`PaymentMethod` захардкоджено (`Parcel`/`Cash`) — не винесено в UI
- [ ] Поштомат — лише базовий тип (`"Поштомат"`), партнерські варіанти (ПриватБанк, InPost) не охоплено
- [ ] Реальна модель залишку по складах/комірках — немає; «Склад відвантаження» одне поле, без списання/резервування
- [ ] Промокод — без реальної таблиці правил/валідації, «Застосувати» лише косметичний стан
- [ ] Менеджер/користувач-що-створив — `DEV_USER.name` (`TODO(auth)`)
- [ ] `orders.status` (пайплайн) і довідник `order_statuses` лишаються не зв'язаними
- [ ] `/orders/[id]` — лише перегляд, без редагування (не просили)
