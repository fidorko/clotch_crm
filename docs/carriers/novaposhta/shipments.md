# InternetDocument — створення/редагування/видалення ЕН, розрахунок

**📄 `update` — задокументована поведінка, не реалізовано.** `calculate`/`save`/`delete` — **✅ реалізовано**. `calculate` — безпечне (read-only). `save`/`delete` — поля звірені лише між незалежними типізованими клієнтами й документованою поведінкою, **живим викликом цієї сесії ще НЕ перевірені** (реальний побічний ефект — створює/скасовує справжнє відправлення на акаунті тенанта, наосліп не тестували). Перший реальний виклик з реальним ключем тенанта — під наглядом людини, з ручною перевіркою результату в кабінеті Нової пошти. **Четвертий прохід** — `save` тепер викликається ОДРАЗУ по кліку «Створити ЕН» в `OrderDeliveryCard` (не при сабміті замовлення), результат зберігається разом із замовленням лише при фінальному збереженні (`createOrderAction`, `server/data/orders.ts`).

`modelName: "InternetDocument"`.

## getDocumentPrice — розрахунок вартості (calculate()) ✅ реалізовано
Безпечний для живого тестування (чисте обчислення, без побічного ефекту). Реалізовано 2026-08-06 (orders-new-order-form.md, редизайн, кнопка «Розрахувати вартість доставки») — `NovaPoshtaProvider.calculate()`, `CitySender`/`CityRecipient`/`Weight`/`ServiceType`/`Cost`/`CargoType`/`SeatsAmount`. **Третій прохід** — `+ PackRef`, коли в замовленні обрано пакування (`getPackList()`): НП сама додає вартість пакування у відповідь `Cost`, окремого поля для неї нема, тому «Доставка» в підсумку замовлення показує суму вже з пакуванням. `ServiceType` тепер обчислюється динамічно (`computeServiceType`, `app/orders/new/actions.ts`) з 4 реальних комбінацій — `WarehouseWarehouse`/`WarehouseDoors`/`DoorsWarehouse`/`DoorsDoors` (сторона відправника з `delivery_method_entity_settings.sender_address_type`, сторона отримувача з обраного в формі типу — Відділення/Поштомат рахуються як «Warehouse», Адреса — «Doors»), раніше був хардкод `"WarehouseWarehouse"`.

**⚠️→✅ Багфікс, четвертий прохід** (жива помилка, знайдена людиною: `"OptionsSeat is empty or one of option is empty"`) — пакування спершу помилково передавалось як `OptionsSeat: [{ packRef }]`. `OptionsSeat` — **інше** поле (об'ємна вага/габарити одного місця: `weight`/`volumetricWidth`/`volumetricLength`/`volumetricHeight`, усі обов'язкові в елементі масиву, якщо масив взагалі передано — звідси помилка «empty option»), не має стосунку до пакування. Пакування вмикається `PackRef` — окремий **top-level** рядок-параметр (Ref з `CommonGeneral.getPackList`), він уже був правильно задокументований у запиті нижче — новий код просто не звірили з цим же файлом перед реалізацією. Виправлено на `PackRef`.

Запит:
```
CitySender, CityRecipient   — Ref міста (Address.getCities)
Weight                       — кг
ServiceType                  — Ref з CommonGeneral.getServiceTypes
Cost                          — оголошена вартість
CargoType                     — Ref з CommonGeneral.getCargoTypes
SeatsAmount                   — кількість місць
PackRef                       — опційно, Ref з CommonGeneral.getPackList
RedeliveryCalculate           — опційно, для післяплати
```
Відповідь (масив):
```
AssessedCost, Cost, CostRedelivery, CostPack, TZoneInfo
```

## getDocumentDeliveryDate — орієнтовна дата доставки
```
DateTime, ServiceType, CitySender, CityRecipient → Date, TimezoneType, Timezone
```

## save — створити ЕН (createShipment()) ✅ реалізовано
```
SenderWarehouseIndex / RecipientWarehouseIndex   — опційно, номер відділення (альтернатива Address)
PayerType                — Ref з CommonGeneral.getTypesOfPayers
PaymentMethod             — Ref з CommonGeneral.getPaymentForms
DateTime, ServiceType, CargoType, Weight, SeatsAmount, Description, Cost
CitySender, Sender, SenderAddress, ContactSender, SendersPhone
CityRecipient, Recipient, RecipientAddress, ContactRecipient, RecipientsPhone
```
Відповідь (масив, `SaveItem`):
```
Ref, CostOnSite, EstimatedDeliveryDate, IntDocNumber, TypeDocument
```
`IntDocNumber` — номер ЕН/ТТН (той самий формат, що маска `TtnInput` уже має в проєкті, `ui-kit.md`).

**⚠️→✅ Багфікс, четвертий прохід** (жива помилка людини: `"OptionsSeat is empty"` при спробі створити ЕН) — на відміну від `getDocumentPrice`, тут `OptionsSeat` — **справді обов'язкове поле**, підтверджений форумний баг НП саме для доставки в поштомат (без нього `save` для поштомата відхиляється). Тепер `createShipment()` завжди додає `OptionsSeat` — по одному запису на `SeatsAmount`, кожен `{ weight, volumetricWidth, volumetricLength, volumetricHeight }` з ваги/габаритів замовлення (`carrier.interface.ts` — `CreateShipmentInput` отримав `packageLengthCm/WidthCm/HeightCm`, раніше там була лише вага).

**`Description` — офіційний ліміт `string[36]`** (звірено людиною напряму з `developers.novaposhta.ua`). **Багфікс, четвертий прохід** (жива помилка: «опис не виводиться на маркуванні/ЕН») — довший текст НП **мовчки ігнорує ціле поле** замість обрізання, тому опис виглядав порожнім на надрукованому документі, хоча реально відправлявся (не помилка запиту — просто тихе відкидання значення). `NovaPoshtaProvider.createShipment()` тепер сам обрізає `Description` до 36 символів перед відправкою; прев'ю в `OrderDeliveryCard.tsx` показує той самий обрізаний текст (`.slice(0, 36)`), щоб не розходитись із тим, що реально піде в ЕН.

**`AdditionalInformation` — ОКРЕМЕ поле** (людина знайшла в реальній документації, приклад `"AdditionalInformation": "Смартфон"`) — саме воно реально показується як «Додаткова інформація про відправлення» в кабінеті НП (там людина шукала опис і спершу не бачила його — `Description` і `AdditionalInformation` — різні поля з різним призначенням, обидва про опис, але окремо відображаються). Задокументованого ліміту довжини нема — надсилаємо повний нескорочений текст. Тепер `createShipment()` передає обидва: `Description` (обрізаний до 36) і `AdditionalInformation` (повний).

**`BackwardDeliveryData` — накладений платіж (грошовий переказ), ✅ реалізовано четвертим проходом** (жива вказівка людини: «обрана післяплата, а грошовий переказ не додається»). Раніше `codAmount`/«Сума післяплати» рахувались лише для показу в CRM (`docs/db.md`), у сам `save` не потрапляли. Реальна структура (звірено з незалежним PHP SDK, `BackwardDeliveryData.php`): масив з одним записом `{ PayerType, CargoType: "Money", RedeliveryString: "<сума>" }`, `PayerType` — той самий Ref, що й для доставки (`payerToNpRef`, окремого налаштування «хто платить за переказ» нема). `codAmount` рахується сервером у `createShipmentNowAction` (`app/orders/new/actions.ts`) через `computeCodAmount()` (`server/data/orders.ts`, той самий формула, що й для `orders.cod_amount`) — **не з клієнтського значення** (§6 CLAUDE.md, тут особливо критично — реальний грошовий переказ на рахунок тенанта), лише з `paymentMethodId`+`partialAmount`, переданих у запит.

**Варіанти save для різних типів отримувача** (окремі під-методи в деяких клієнтах, той самий `save` з іншим набором полів по суті):
- `SavePostomat` — доставка в поштомат, додає `OptionsSeat[]`
- `SaveWarehouse` — новий контрагент-отримувач (фізособа), додає `RecipientCityName`/`RecipientArea`/`RecipientHouse`/`RecipientFlat`/`RecipientType` тощо
- `SaveAddress` — доставка на адресу, аналогічний набір + `RecipientAddressNote`

**Реалізація (`NovaPoshtaProvider.createShipment`, orders.md — форма нового замовлення).** Відправник — завжди існуючий контрагент акаунта (`ShipmentCounterpartyAddress`, `carrier.interface.ts`, дані з `delivery_methods.sender*`). Отримувач при оформленні замовлення — **реальна людина, якої майже напевне ще нема серед контрагентів акаунта перевізника** (типовий e-commerce кейс), тому окремий тип `ShipmentNewRecipient` (без `counterpartyRef`/`contactPersonRef`) — варіант `SaveWarehouse` вище: замість `Recipient`/`ContactRecipient` (порожні рядки) передаються `RecipientCityName`/`RecipientName`/`RecipientType: "PrivatePerson"` + прапорець `NewAddress: "1"`, і Нова пошта сама створює контрагента-отримувача. Поля `RecipientName`/`RecipientType`/`NewAddress` звірені додатково через PHP SDK (`serj1chen/nova-poshta-sdk-php`, `getDataInternetDocument`) — **⚠️ це найменш перевірена частина**, перший реальний виклик з ключем тенанта вимагає нагляду людини (business-mapping.md).

Тип вантажу (`CargoType`) і форма оплати (`PaymentMethod`) — усе ще **хардкод**: `"Parcel"` (посилка), `"Cash"` (готівка) — не винесено в UI форми замовлення (`orders.md`, «Відкрито»). `ServiceType` — **третій прохід**, більше не хардкод (див. вище, `getDocumentPrice`). `PayerType` — переклад внутрішнього enum `delivery_methods.payer` (`sender`/`recipient`/`third_party`) у справжній Ref НП (`payerToNpRef`, `mapper.ts`).

**Поштомат (третій прохід)** — рахується на боці отримувача так само, як відділення (`Warehouse` половина `ServiceType`), `RecipientAddress` — той самий `Ref` точки видачі, лише пошук (`Address.getWarehouses`) звужений `TypeOfWarehouseRef` (реальний живий пошук — `Address.getWarehouseTypes`, `reference-data.md`).

**Адреса (третій прохід, ⚠️ НЕ перевірено живим викликом)** — `ShipmentNewRecipient` тепер має альтернативну пару полів `streetRef`+`houseNumber` замість `warehouseRef`: `RecipientAddress: streetRef`, `BuildingNumber: houseNumber`. Ця конкретна гілка (`Doors`-отримувач, новий контрагент) — найменш перевірена частина всього `createShipment`: перший реальний виклик з реальним ключем тенанта обов'язково під наглядом людини, з перевіркою результату в кабінеті Нової пошти.

## update — редагувати ЕН (updateShipment())
Той самий набір полів, що `save`, плюс обов'язковий `Ref` створеного документа.

## delete — скасувати ЕН (deleteShipment()) ✅ реалізовано четвертим проходом
Пряма вказівка людини («Додай кнопку Видалити ЕН») — `NovaPoshtaProvider.deleteShipment()`, кнопка в `OrderDeliveryCard` (замінює «Створити ЕН», коли ЕН уже створена; знімає блокування полів отримувача/ваги/габаритів).
```
DocumentRefs — Ref документа (можна масив)
```
Відповідь: `[{ Ref }]`.

## getDocumentList — список ЕН тенанта
```
DateTimeFrom, DateTimeTo, GetFullList, Page → масив ЕН з повним статусом/сумою/вагою
```
Корисно для майбутнього «Мої відправлення», якщо колись знадобиться синхронізація без трекінгу по одному номеру.
