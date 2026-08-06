# Довідникові дані — Address / Counterparty / CommonGeneral

Усе нижче — **✅ перевірено живим викликом** (2026-08-05/06, реальний ключ тенанта). Приклади відповідей скорочені (взято перші 1-2 елементи, реальні поля не вигадані — пряма копія відповіді API). Це джерело вже живить `/settings?tab=delivery` (`settings-delivery.md`).

## Address.getCities — пошук міста
```json
{"apiKey": "...", "modelName": "Address", "calledMethod": "getCities",
 "methodProperties": {"FindByString": "Львів", "Limit": "2"}}
```
```json
[{
  "Description": "Львів", "Ref": "db5c88f5-391c-11dd-90d9-001a92567626",
  "Area": "71508134-9b87-11de-822f-000c2965ae0e", "AreaDescription": "Львівська",
  "SettlementTypeDescription": "місто", "CityID": "8"
}]
```
**Гочка:** `Ref` тут — це «City»-namespace, саме він (не settlement-Ref з `searchSettlements`) потрібен як `CityRef` у `getWarehouses` нижче. `Address.searchSettlements` повертає ІНШИЙ Ref (settlement) + окреме поле `DeliveryCity`, яке збігається з цим `Ref` із `getCities` — переплутати легко, наш клієнт (`src/server/carriers/novaposhta/client.ts`) використовує тільки `getCities`, не `searchSettlements`, щоб уникнути плутанини.

## Address.getWarehouses — пошук відділення в місті
```json
{"modelName": "Address", "calledMethod": "getWarehouses",
 "methodProperties": {"CityRef": "db5c88f5-391c-11dd-90d9-001a92567626", "FindByString": "Шевченка", "Limit": "3"}}
```
```json
[{
  "Ref": "0d545ed3-e1c2-11e3-8c4a-0050568002cf",
  "Description": "Відділення №17 (до 30 кг на одне місце): вул. Шевченка, 323",
  "ShortAddress": "Львів, Шевченка, 323",
  "TypeOfWarehouse": "841339c7-591a-42e2-8233-7a0a00f0ed6f",
  "CityRef": "db5c88f5-391c-11dd-90d9-001a92567626", "Number": "17"
}]
```

## Address.getWarehouseTypes — типи відділень (для фільтра «лише поштомати» тощо)
```json
[
  {"Ref": "9a68df70-0267-42a8-bb5c-37f427e36ee4", "Description": "Вантажне(ий)"},
  {"Ref": "841339c7-591a-42e2-8233-7a0a00f0ed6f", "Description": "Поштове(ий)"},
  {"Ref": "f9316480-5f2d-425d-bc2c-ac7cd29decf0", "Description": "Поштомат"},
  {"Ref": "95dc212d-479c-4ffb-a8ab-8c1b9073d0bc", "Description": "Поштомат ПриватБанку"},
  {"Ref": "6f8c7162-4b72-4b0a-88e5-906948c6a92f", "Description": "Поштове відділення з обмеження"}
]
```
**✅ Реалізовано третім проходом** (`NovaPoshtaProvider.getWarehouseTypes()`, `provider.ts`) — `getWarehouses(cityRef, query, "postomat")` живим викликом шукає `Ref`, де `Description === "Поштомат"` (лише базовий тип — партнерські «Поштомат ПриватБанку» тощо свідомо не охоплено, `orders-new-order-form.md`, «Відкрито»), передає як `TypeOfWarehouseRef`. Раніше не використовувалось; список вище (записаний про запас) підтвердився живим викликом.

**Багфікс, четвертий прохід** (людина: «коли обираю поштомат — його нема в списку, а він є у списку відділень») — `kind="warehouse"` (Відділення) раніше не фільтрував ЗОВСІМ (`undefined` → API повертає точки видачі всіх типів упереміш, включно з поштоматами). Тепер `getWarehouses()` фільтрує **завжди** — `kind="warehouse"` шукає `Ref` для `"Поштове(ий)"`, `kind="postomat"` — для `"Поштомат"`. Заразом `getWarehouseTypes()` закешовано (module-level `Map<apiKey, {...}>`, TTL 1 год) — без кешу кожен пошук у `NpSearchCombobox` (debounce 300мс) робив зайвий виклик і живо впирався в rate-limit НП («To many requests», перевірено live-тестом цієї сесії).

## Counterparty.getCounterparties — контрагенти-відправники тенанта
```json
{"modelName": "Counterparty", "calledMethod": "getCounterparties",
 "methodProperties": {"CounterpartyProperty": "Sender", "Page": "1"}}
```
```json
[{
  "Ref": "9cc6eb47-4d5e-11ee-a60f-48df37b921db",
  "Description": "Приватна особа", "CounterpartyType": "PrivatePerson",
  "City": "00000000-0000-0000-0000-000000000000"
}]
```
На тестовому акаунті — лише 1 контрагент («Приватна особа»). Реальний бізнес-акаунт матиме більше (`settings-delivery.md`, «Відкрито»).

## Counterparty.getCounterpartyContactPersons — контактні особи контрагента
```json
{"modelName": "Counterparty", "calledMethod": "getCounterpartyContactPersons",
 "methodProperties": {"Ref": "<counterparty Ref>", "Page": "1"}}
```
```json
[{"Ref": "...", "Description": "Прізвище Ім'я По-батькові", "Phones": "380XXXXXXXXX"}]
```
`Phones` — без `+` на початку, наш `mapper.ts` додає `+` перед збереженням (conventions.md, нормалізація телефону).

## Counterparty.getCounterpartyAddresses — адреси контрагента
```json
{"methodProperties": {"Ref": "<counterparty Ref>", "CounterpartyProperty": "Sender"}}
```
На тестовому акаунті повернуло **порожній масив** — контрагент без зареєстрованих «дверних» адрес (типово для приватної особи, що завжди відправляє з відділення). Тому відправника ми моделюємо через City+Warehouse (`getCities`/`getWarehouses`), не лише через цей метод.

## CommonGeneral.getServiceTypes — типи доставки (не `Reference`!)
```json
[
  {"Description": "Адреса-Адреса", "Ref": "DoorsDoors"},
  {"Description": "Адреса-Відділення", "Ref": "DoorsWarehouse"},
  {"Description": "Відділення-Відділення", "Ref": "WarehouseWarehouse"},
  {"Description": "Відділення-Адреса", "Ref": "WarehouseDoors"},
  {"Description": "Адреса-Поштомат", "Ref": "DoorsPostomat"}
]
```

## CommonGeneral.getTypesOfPayers — хто платить
```json
[
  {"Description": "Відправник", "Ref": "Sender"},
  {"Description": "Одержувач", "Ref": "Recipient"},
  {"Description": "Третя особа", "Ref": "ThirdPerson"}
]
```

## CommonGeneral.getPaymentForms — форма оплати
```json
[{"Description": "Безготівковий", "Ref": "NonCash"}, {"Description": "Готівка", "Ref": "Cash"}]
```
Не використано в UI ще (`settings-delivery.md` моделює лише «хто платить», не форму оплати — не просили).

## CommonGeneral.getCargoTypes — тип вантажу
```json
[
  {"Description": "Посилка", "Ref": "Parcel"}, {"Description": "Вантаж", "Ref": "Cargo"},
  {"Description": "Документи", "Ref": "Documents"}, {"Description": "Шини-диски", "Ref": "TiresWheels"},
  {"Description": "Палети", "Ref": "Pallet"}
]
```
Знадобиться для `InternetDocument.save` (`shipments.md`) — `CargoType` обов'язкове поле.

## CommonGeneral.getPackList — упаковка (десятки позицій)
```json
[{
  "Ref": "0b39fcdc-45e3-11e7-80c8-005056887b8d",
  "Description": "Конверт поліетиленовий малий  235*250 мм б/н",
  "Length": "0.0", "Width": "0.0", "Height": "0.0"
}]
```
Живиться повним списком (без параметра пошуку — метод повертає все одразу), фільтрація — клієнтська (`DeliveryMethodPackagingFields.tsx`).

## CommonGeneral.getCargoDescriptionList — опис вантажу (для «Опис відправлення»)
```json
{"methodProperties": {"FindByString": "одяг"}}
```
```json
[{"Ref": "2fe893e7-33ee-11e3-b441-0050568002cf", "Description": "Одяг"}]
```
Не використано в `settings-delivery.md` ще (там «Опис відправлення» — CRM-конфігурація формату тексту, не вибір із цього довідника) — записано про запас для `InternetDocument.save`, де `CargoDescription`-ref може знадобитись.
