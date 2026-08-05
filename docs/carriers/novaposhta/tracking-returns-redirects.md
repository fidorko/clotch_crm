# Трекінг / Повернення / Переадресація

## TrackingDocument.getStatusDocuments — track()

**📄 Задокументована поведінка** (безпечно для живого тесту — read-only, але не тестували цієї сесії, бо потрібен реальний номер ЕН; тестовий акаунт жодного не має). `modelName: "TrackingDocument"`, **ключ API не обов'язковий для цього методу** (за документованою поведінкою кількох джерел — варто перевірити, чи наш `client.ts` все одно передає ключ тенанта для узгодженості з рештою викликів).

Запит:
```json
{"modelName": "TrackingDocument", "calledMethod": "getStatusDocuments",
 "methodProperties": {"Documents": [{"DocumentNumber": "20450296339688", "Phone": "380XXXXXXXXX"}]}}
```
`Phone` — опційний, але без нього відповідь менш детальна (не показує ПІБ відправника/отримувача).

Відповідь — масив об'єктів зі статусом (80+ полів за документованою поведінкою, ключові):
```
Number, StatusCode, Status, ScheduledDeliveryDate, RecipientFullName,
CitySender, CityRecipient, SenderAddress, RecipientAddress,
DocumentWeight, DocumentCost, SeatsAmount, PayerType, CargoType, ServiceType
```
До 100 номерів за один запит (документована поведінка).

## AdditionalService — повернення (createReturn())

**⚠️ Потребує звірки** — назви методів підтверджені у 2 незалежних джерелах, точні поля запиту зібрати впевнено не вдалось (офіційний портал блокує бот-доступ). Перед реалізацією — людині відкрити `developers.novaposhta.ua` в браузері й звірити.

Відомі методи (`modelName`, ймовірно `AdditionalService` або `AdditionalServiceGeneral` — уточнити):
- `CheckPossibilityCreateReturn` — перевірити, чи можна оформити повернення для цього ЕН
- `orderCargoReturn` (або `save` з типом повернення) — оформити повернення
- `getReturnOrdersList` — список активних повернень

Саме цей блок стосується побажання людини «при відмові на відділенні — оформити повернення по API» (`settings-delivery.md`, `orderReturnOnRefusal`) — коли дійде до реалізації, тут і починати.

## AdditionalService — переадресація (redirectShipment())

Той самий рівень довіри, що повернення вище:
- `checkPossibilityForRedirecting` — перевірити можливість переадресації
- `getRedirectionOrdersList` — список переадресацій
- Метод створення переадресації (ймовірно `orderRedirecting` чи аналог `save`) — назву не вдалось підтвердити впевнено, **⚠️ звірити перед реалізацією**.
