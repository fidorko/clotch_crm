# Нова пошта — API 2.0, огляд

Довідник для розробки `src/server/carriers/novaposhta/` (`CLAUDE.md`, пряма вказівка людини 2026-08-05/06: документація — перед кодом, основне джерело знань під час розробки).

## Джерела й рівень довіри

Кожен розділ нижче позначений одним із трьох рівнів:

- **✅ Перевірено живим викликом** — реальний запит цією сесією, з реальним ключем тенанта, відповідь бачив на власні очі (`docs/modules/settings-delivery.md` — та сама перевірка, що вже живить `/settings?tab=delivery`).
- **📄 Задокументована поведінка** — не перевірено живим викликом (дія має реальний побічний ефект — створює відправлення/повернення, тестувати наосліп небезпечно), але звірено з кількома незалежними типізованими сторонніми клієнтами (Go `platx/go-nova-poshta`, PHP `serj1chen/nova-poshta-sdk-php`, `daaner/NovaPoshta`) — імена полів збігаються між ними, тому висока довіра, хоч і не first-hand.
- **⚠️ Потребує звірки** — метод існує (підтверджено назвою в кількох джерелах), але точні поля запиту/відповіді не вдалося зібрати впевнено. Офіційний портал (`developers.novaposhta.ua`, `devcenter.novaposhta.ua`) блокує бот-доступ (`403 Forbidden`) для автоматизованого читання — перед реалізацією цих методів людині варто самій відкрити офіційну документацію в браузері й звірити.

**`shopanaio/carrier-api`** (https://github.com/shopanaio/carrier-api) використано лише як довідник структури/імен методів (пряма вказівка людини) — не залежність, код звідти не копіювався.

## Базове підключення

- URL: `https://api.novaposhta.ua/v2.0/json/`
- Метод: завжди `POST`, тіло — JSON: `{ apiKey, modelName, calledMethod, methodProperties }`
- Ключ — з поля способу доставки тенанта (`delivery_methods.api_key`), ніколи не хардкодиться (`db.md`)

### Конверт відповіді (✅ бачив у кожному живому виклику цієї сесії)
```json
{
  "success": true,
  "data": [ /* масив результатів методу */ ],
  "errors": [],
  "warnings": [],
  "info": [],
  "messageCodes": [],
  "errorCodes": [],
  "warningCodes": [],
  "infoCodes": []
}
```
`success: false` + `warnings: ["Model is invalid"]` — саме так виглядає помилка «неправильний `modelName`» (ловив живцем, коли пробував `Reference` замість `CommonGeneral`, нижче).

## Групування моделей (`modelName`)

| modelName | Призначення | Файл документації |
|---|---|---|
| `Address` | Міста/вулиці/відділення | `reference-data.md` |
| `Counterparty` | Контрагенти/контактні особи/адреси | `reference-data.md` |
| `CommonGeneral` | Фіксовані довідники (типи доставки, платники, пакування, вантаж) — **не `Reference`, попри те що так називається в офіційних HTML-сторінках і в багатьох сторонніх клієнтах** | `reference-data.md` |
| `InternetDocument` | Створення/редагування/видалення ЕН, розрахунок вартості, дата доставки | `shipments.md` |
| `TrackingDocument` | Трекінг відправлення | `tracking-returns-redirects.md` |
| `AdditionalService`/`AdditionalServiceGeneral` | Повернення, переадресація | `tracking-returns-redirects.md` |

**Гочка (перевірено живцем 2026-08-05):** `Reference.getServiceTypes` повертає `success: false, warnings: ["Model is invalid"]` — правильна модель для довідників (типи доставки/платники/пакування/вантаж) — **`CommonGeneral`**. Офіційні HTML-сторінки документації (і назви методів у більшості сторонніх клієнтів) називають цю групу «Reference» лише в тексті — реальний `modelName` інший. Легко наступити на ті самі граблі знову — записано тут навмисно.

## Інші файли цього довідника

- `reference-data.md` — Address/Counterparty/CommonGeneral (усе ✅ перевірено живцем)
- `shipments.md` — InternetDocument: `save`/`update`/`delete`/`getDocumentPrice`/`getDocumentDeliveryDate`/`getDocumentList` (📄 задокументована поведінка)
- `tracking-returns-redirects.md` — TrackingDocument.getStatusDocuments (📄), AdditionalService повернення/переадресація (⚠️)
- `printing.md` — друк ЕН/маркування (⚠️ — офіційний механізм друку не URL-based JSON-метод, потребує окремої звірки)
- `errors.md` — як API повідомляє про помилки (без вигаданої таблиці кодів — офіційний список `developers.novaposhta.ua/listerrorscodes` не вдалось прочитати ботом)
- `business-mapping.md` — таблиця «бізнес-функція CRM → метод API» (як просила людина)
