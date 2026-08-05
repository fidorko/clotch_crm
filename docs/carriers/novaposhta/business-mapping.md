# Бізнес-функція CRM ↔ метод API Нової пошти

| Бізнес-функція CRM | Метод `NovaPoshtaProvider` | `modelName.calledMethod` | Стан |
|---|---|---|---|
| Перевірити API-ключ («Перевірити підключення», `settings-delivery.md`) | — (окремий `testConnection`, не частина `CarrierProvider`) | `Address.getCities` | ✅ реалізовано |
| Пошук міста (відправник за замовчуванням, майбутня форма замовлення) | `getCities()` | `Address.getCities` | ✅ реалізовано |
| Пошук відділення в місті | `getWarehouses()` | `Address.getWarehouses` | ✅ реалізовано |
| Список контрагентів-відправників тенанта | `getCounterparties()` | `Counterparty.getCounterparties` | ✅ реалізовано |
| Контактні особи контрагента (каскад після вибору контрагента) | — (`getCounterparties()` з деталями чи окремий метод — на розсуд реалізації) | `Counterparty.getCounterpartyContactPersons` | ✅ реалізовано |
| Довідник вулиць (відправник → «Звідки відправляємо: Адреса», `settings-delivery.md`) | `getStreets()` | `Address.getStreet` (**однина!** `getStreets` не існує — "Method AddressGeneral_getStreets not found", перевірено живим викликом 2026-08-06) | ✅ реалізовано |
| Довідник населеного пункту (уточнення area/region) | `getSettlement()` | `Address.searchSettlements` | ⚠️ не реалізовано, не просили ще |
| Розрахунок вартості доставки (майбутнє «Оформити замовлення») | `calculate()` | `InternetDocument.getDocumentPrice` | 📄 задокументовано, не реалізовано |
| Створити ЕН при оформленні замовлення | `createShipment()` | `InternetDocument.save` | 📄 задокументовано, не реалізовано |
| Редагувати ЕН | `updateShipment()` | `InternetDocument.update` | 📄 задокументовано, не реалізовано |
| Скасувати ЕН | `deleteShipment()` | `InternetDocument.delete` | 📄 задокументовано, не реалізовано |
| «Показати, де моя посилка» (майбутній ШІ-чат, людина згадала прямо) | `track()` | `TrackingDocument.getStatusDocuments` | 📄 задокументовано, не реалізовано |
| «Оформити повернення при відмові» (`orderReturnOnRefusal`, `settings-delivery.md`) | `createReturn()` | `AdditionalService.orderCargoReturn` (назва орієнтовна) | ⚠️ звірити перед реалізацією |
| Переадресація відправлення | `redirectShipment()` | `AdditionalService` (метод не підтверджено) | ⚠️ звірити перед реалізацією |
| Друк ЕН/маркування | `printDocuments()` | URL-based, не JSON-метод (`printing.md`) | ⚠️ звірити перед реалізацією |

**Легенда:** ✅ реалізовано й перевірено живим викликом · 📄 контракт задокументований (сторонні типізовані клієнти), реалізація ще не написана · ⚠️ потребує ручної звірки з офіційною документацією перед першою реалізацією.

Методи інтерфейсу `CarrierProvider` (`carrier.interface.ts`), яких ще нема в цій таблиці бізнес-функцій — залишаються в інтерфейсі для інших перевізників (Укрпошта/Meest/Rozetka), навіть якщо Нова пошта якийсь конкретний варіант не потребує.
