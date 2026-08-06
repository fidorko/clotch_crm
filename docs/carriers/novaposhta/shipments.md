# InternetDocument — створення/редагування/видалення ЕН, розрахунок

**📄 `update`/`delete`/`calculate` — задокументована поведінка, не реалізовано.** `save` (нижче) — **✅ реалізовано** (`NovaPoshtaProvider.createShipment`, 2026-08-06, форма `/orders/new`, orders.md) — але поля звірені лише між трьома незалежними типізованими клієнтами (Go `platx/go-nova-poshta`, PHP `serj1chen/nova-poshta-sdk-php`, `daaner/NovaPoshta`) плюс перехресна перевірка PHP SDK-джерела (`getDataInternetDocument`) для полів нового отримувача — **живим викликом цієї сесії ще НЕ перевірено** (реальний побічний ефект — створює справжнє відправлення на акаунті тенанта, наосліп не тестували). Перший реальний виклик з реальним ключем тенанта — під наглядом людини, з ручним скасуванням/перевіркою результату в кабінеті Нової пошти.

`modelName: "InternetDocument"`.

## getDocumentPrice — розрахунок вартості (calculate())
Безпечний для живого тестування (чисте обчислення, без побічного ефекту) — **перший кандидат на перевірку живим викликом**, коли дійдемо до реалізації `calculate()`.

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

**Варіанти save для різних типів отримувача** (окремі під-методи в деяких клієнтах, той самий `save` з іншим набором полів по суті):
- `SavePostomat` — доставка в поштомат, додає `OptionsSeat[]`
- `SaveWarehouse` — новий контрагент-отримувач (фізособа), додає `RecipientCityName`/`RecipientArea`/`RecipientHouse`/`RecipientFlat`/`RecipientType` тощо
- `SaveAddress` — доставка на адресу, аналогічний набір + `RecipientAddressNote`

**Реалізація (`NovaPoshtaProvider.createShipment`, orders.md — форма нового замовлення).** Відправник — завжди існуючий контрагент акаунта (`ShipmentCounterpartyAddress`, `carrier.interface.ts`, дані з `delivery_methods.sender*`). Отримувач при оформленні замовлення — **реальна людина, якої майже напевне ще нема серед контрагентів акаунта перевізника** (типовий e-commerce кейс), тому окремий тип `ShipmentNewRecipient` (без `counterpartyRef`/`contactPersonRef`) — варіант `SaveWarehouse` вище: замість `Recipient`/`ContactRecipient` (порожні рядки) передаються `RecipientCityName`/`RecipientName`/`RecipientType: "PrivatePerson"` + прапорець `NewAddress: "1"`, і Нова пошта сама створює контрагента-отримувача. Поля `RecipientName`/`RecipientType`/`NewAddress` звірені додатково через PHP SDK (`serj1chen/nova-poshta-sdk-php`, `getDataInternetDocument`) — **⚠️ це найменш перевірена частина**, перший реальний виклик з ключем тенанта вимагає нагляду людини (business-mapping.md).

Обслуговування (`ServiceType`), тип вантажу (`CargoType`) і форма оплати (`PaymentMethod`) — на цьому проході **хардкод**: `"WarehouseWarehouse"` (відділення-відділення, адресна доставка не підтримана), `"Parcel"` (посилка), `"Cash"` (готівка) — не винесено в UI форми замовлення (`orders.md`, «Відкрито»). `PayerType` — переклад внутрішнього enum `delivery_methods.payer` (`sender`/`recipient`/`third_party`) у справжній Ref НП (`payerToNpRef`, `mapper.ts`).

## update — редагувати ЕН (updateShipment())
Той самий набір полів, що `save`, плюс обов'язковий `Ref` створеного документа.

## delete — скасувати ЕН (deleteShipment())
```
DocumentRefs — Ref документа (можна масив)
```
Відповідь: `[{ Ref }]`.

## getDocumentList — список ЕН тенанта
```
DateTimeFrom, DateTimeTo, GetFullList, Page → масив ЕН з повним статусом/сумою/вагою
```
Корисно для майбутнього «Мої відправлення», якщо колись знадобиться синхронізація без трекінгу по одному номеру.
