# Модуль: orders — піддокумент «Форма нового замовлення» (/orders/new)

Частина модуля `orders` (`docs/modules/orders.md`) — винесено окремо за тим самим правилом, що «Доставка» в `settings` (`CLAUDE.md`, розділ 0). Статус/доступ — спільні з `orders.md`, тут немає власного запису в `map.md`.

**Маршрут:** /orders/new

## Призначення
Перший реальний бек модуля «Замовлення» — пряма вказівка людини: форма нового замовлення (кнопка «Створити замовлення», раніше заглушка) + **реальне створення ЕН Нової пошти** (`InternetDocument.save`, раніше кидало `CarrierNotImplementedError`). Список `/orders` лишається на моках — окрема задача звести їх (`orders.md`, «Відкрито»), нове замовлення поки НЕ зʼявляється у списку.

**Клієнт** — ім'я+телефон+email, без окремого пошуку/вибору: `createOrGetCustomer` сам знаходить наявного клієнта за нормалізованим телефоном (`UNIQUE(tenant_id, phone)`) при збереженні; поле телефону на blur тихо підказує «Постійний клієнт: <ім'я>», якщо номер уже є в базі.

**Товари** — `ProductSkuCombobox` (реальний каталог `product_skus`, ціна за замовчуванням — реальна роздрібна ціна товару, `retailPrice` з `listProductSkusCatalog`), редаговані кількість/ціна на рядок, сума рахується на льоту.

**Доставка** — реальний `Select` способів доставки тенанта (`delivery_methods`, лише `isEnabled`). Для Нової пошти — реальний пошук міста/відділення отримувача (`NpSearchCombobox`, той самий компонент, що відправник у `settings-delivery.md`, тенантський ключ цього способу доставки), ім'я+телефон отримувача, вага/місця/оголошена вартість/опис вантажу (редаговані, з розумними дефолтами), чекбокс **«Створити ЕН одразу»** — за замовчуванням `false` (реальний побічний ефект на акаунті перевізника, людина вмикає свідомо для кожного замовлення). Для інших перевізників — доставка фіксується в замовленні без виклику API (чесно позначено в UI).

**Створення ЕН (`NovaPoshtaProvider.createShipment`, `docs/carriers/novaposhta/shipments.md`)** — окремий виклик carrier API ПІСЛЯ commit замовлення (мережевий виклик не тримає відкритою DB-транзакцію). Відправник — завжди контрагент зі збережених налаштувань способу доставки (`ShipmentCounterpartyAddress`); отримувач — **новий контрагент** (`ShipmentNewRecipient`, `RecipientName`/`RecipientType: "PrivatePerson"`/`NewAddress: "1"`, без `counterpartyRef` — Нова пошта створює контрагента-отримувача сама, типовий e-commerce сценарій). Якщо виклик API падає — замовлення лишається створеним (без ТТН), помилка показується окремим банером, весь `createOrderAction` не відкочується.

**Спрощення цього проходу (свідомо, не вигадано за межі задачі):** `ServiceType` завжди `WarehouseWarehouse` (лише відділення-відділення, без адресної доставки), `CargoType` завжди `Parcel`, `PaymentMethod` завжди `Cash` — жодне з трьох не винесено в UI. Стосується лише Нової пошти — інші перевізники (Укрпошта/Meest/довільні) не мають реального провайдера (`carrier.factory.ts`).

## Файли
| Шлях | Роль |
|---|---|
| src/app/orders/new/page.tsx | сторінка — тягне реальні `listDeliveryMethods`(лише enabled)+`listProductSkusCatalog` |
| src/app/orders/new/actions.ts | `searchCustomersAction`, `createOrderAction` — валідація, `createOrder`, опційний виклик `getCarrierProvider().createShipment` + `saveOrderShipment` |
| src/components/orders/new/OrderForm.tsx | оркестратор — стан форми, submit, лейаут (2 колонки), успіх-панель |
| src/components/orders/new/OrderCustomerCard.tsx | клієнт — ім'я/телефон/email, "живий" натяк по наявному клієнту (`searchCustomersAction`) |
| src/components/orders/new/OrderItemsCard.tsx | товари — `ProductSkuCombobox`, редаговані рядки, підсумок |
| src/components/orders/new/OrderDeliveryCard.tsx | доставка — вибір способу, поля отримувача НП (`NpSearchCombobox`), вага/місця/вартість/опис, чекбокс «Створити ЕН одразу» |
| src/components/products/ProductSkuCombobox.tsx | перенесено з `warehouse/receiving/AddSkuCombobox.tsx` (ui-kit.md, правило 9.2 — 2 використання) |
| src/components/carriers/NpSearchCombobox.tsx | перенесено з `settings/DeliveryMethodSenderFields.tsx` (ui-kit.md, правило 9.2 — 2 використання) |
| src/server/data/customers.ts | `searchCustomers`, `findCustomerByPhone`, `createOrGetCustomer` (усередині транзакції `createOrder`) |
| src/server/data/orders.ts | `createOrder` (транзакція: клієнт+номер+order+items), `saveOrderShipment`, `getOrderById` |
| src/server/db/schema/customers.ts, orders.ts | таблиці `customers`/`orders`/`order_items` — `db.md` |
| src/server/carriers/carrier.interface.ts | `ShipmentAddress` → discriminated union (`ShipmentCounterpartyAddress`/`ShipmentNewRecipient`), `CreateShipmentInput.paymentMethod` — редизайн під реальний виклик (нічого раніше не залежало від старої форми, `createShipment` лише кидав `CarrierNotImplementedError`) |
| src/server/carriers/novaposhta/provider.ts | `createShipment` — реальний виклик `InternetDocument.save` |
| src/server/carriers/novaposhta/mapper.ts | `mapShipmentResult`, `toNpPhone`, `formatNpDate`, `payerToNpRef` (внутрішній enum `delivery_methods.payer` → Ref НП) |
| src/lib/types/orders.ts | `ORDER_PAYMENT_METHOD_OPTIONS` (фіксований список, не довідник) |

## Дані
`customers`/`orders`/`order_items` — тенант-скоуповано, RLS. Деталі колонок/індексів — `db.md`, розділ `customers / orders / order_items`.

## Доступ
Ролі: owner (поки єдина активна роль) — той самий, що `orders.md`.

## Зв'язки
Залежить від: `delivery_methods` (спосіб доставки+відправник, `settings-delivery.md`), `product_skus`/`products` (каталог+ціна), `server/carriers/` (реальний виклик НП).
Від нього залежать: — (список `/orders` ще не читає ці таблиці).

## Зроблено
- 2026-08-06 — перший прохід: реальні таблиці + форма + реальне `InternetDocument.save`. `tsc`/`next build`/`eslint` чисто. Жива перевірка headless Playwright (npx-кешований `playwright`, `chromium-cli` недоступний — той самий прийом, що перший прохід `orders.md`): перехід зі списку на форму, заповнення клієнта (з нормалізацією телефону), додавання реальної позиції каталогу (справжня ціна товару з БД, включно з товаром із нульовою ціною — коректно відображено, не вигадано), вибір способу доставки «Нова Пошта» показав поля отримувача, збереження без чекбокса «Створити ЕН одразу» (свідомо не викликали реальний API під час автоматичної перевірки) → успіх-панель з `ORD-0001`/`ORD-0002`, консоль без помилок (виправлено `nativeButton` попередження Base UI на `Button render={<Link/>}`). Тестові замовлення й клієнт видалено з БД одразу після перевірки.

## Відкрито
- [ ] **`createShipment` не перевірено живим викликом** з реальним ключем тенанта — поля отримувача-новачка (`RecipientName`/`RecipientType`/`NewAddress`) звірені лише по сторонніх SDK, не по офіційній документації (заблокована для бота) чи реальній відповіді API. Перший реальний тест — під наглядом людини, з перевіркою результату в кабінеті Нової пошти
- [ ] `ServiceType`/`CargoType`/`PaymentMethod` захардкоджено (`WarehouseWarehouse`/`Parcel`/`Cash`) — адресна доставка, інші типи вантажу чи безготівкова оплата не підтримані цим проходом
- [ ] Список `/orders` не читає нові таблиці — створене замовлення не з'являється в списку (окрема задача, `orders.md`)
- [ ] Склад/резервування залишку — створення замовлення НЕ списує `product_skus.stock`, немає перевірки достатності залишку
- [ ] `updateShipment`/`deleteShipment`/`track` — досі не реалізовані (`CarrierNotImplementedError`); якщо реальне створення ЕН провалиться частково (створилось на акаунті НП, але запис у БД не встиг оновитись) — ручне виправлення через кабінет перевізника, автоматичного узгодження нема
- [ ] Менеджер — `DEV_USER.name` (`TODO(auth)`), той самий підхід, що список `/orders`
