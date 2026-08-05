# InternetDocument — створення/редагування/видалення ЕН, розрахунок

**📄 Задокументована поведінка** — не перевірено живим викликом цієї сесії: `save`/`update`/`delete` реально створюють/змінюють/скасовують справжнє відправлення на акаунті тенанта (реальний побічний ефект, не read-only довідник), тому наосліп не тестували. Поля нижче звірені між трьома незалежними типізованими клієнтами (Go `platx/go-nova-poshta`, PHP `serj1chen/nova-poshta-sdk-php`, `daaner/NovaPoshta`) — імена збігаються, висока довіра, але перед першим реальним викликом варто зробити один ручний тест на реальному замовленні й звірити з офіційною документацією (`developers.novaposhta.ua`, блокує бот-доступ — читати людині в браузері).

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

## save — створити ЕН (createShipment())
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
