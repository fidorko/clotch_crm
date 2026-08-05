// Довідникові значення API Нової пошти, перевірені живим викликом 2026-08-05
// (CommonGeneral.getServiceTypes/getTypesOfPayers, реальний ключ тенанта) —
// стабільний фіксований словник, тому хардкод, не живий запит при кожному
// відкритті попапу (той самий підхід, що REFERENCE_ITEM_KINDS, db.md).
// Тримати синхронно вручну з default-масивом у
// server/db/schema/delivery-methods.ts (schema-файли навмисно не імпортують
// з lib/, той самий прийом, що reference-item-kinds.ts).
export const NOVA_POSHTA_SERVICE_TYPES: { ref: string; label: string }[] = [
  { ref: "WarehouseWarehouse", label: "Відділення — Відділення" },
  { ref: "WarehouseDoors", label: "Відділення — Адреса" },
  { ref: "DoorsWarehouse", label: "Адреса — Відділення" },
  { ref: "DoorsDoors", label: "Адреса — Адреса" },
  { ref: "DoorsPostomat", label: "Адреса — Поштомат" },
];

export const NOVA_POSHTA_PAYER_TYPES: { ref: "sender" | "recipient" | "third_party"; label: string }[] = [
  { ref: "sender", label: "Відправник" },
  { ref: "recipient", label: "Одержувач" },
  { ref: "third_party", label: "Третя особа" },
];

// Реальні StatusCode відправлень Нової пошти (2026-08-06) — офіційний портал
// блокує бот-доступ (403), список зведено зі сторонньої технічної статті, що
// сама реалізує опитування статусів через TrackingDocument.getStatusDocuments
// (createit.com/blog/nova-poshta-get-package-status-using-cron) — стаття сама
// зазначає "може бути неповним/застарілим", тому не видавати за вичерпний
// офіційний список. Використовується як Select у правилах "статус перевізника
// → статус замовлення" (settings-delivery.md) замість вільного тексту.
export const NOVA_POSHTA_TRACKING_STATUSES: { code: string; label: string }[] = [
  { code: "1", label: "Очікується надходження від відправника" },
  { code: "2", label: "Видалено" },
  { code: "3", label: "Номер не знайдено" },
  { code: "4", label: "У місті відправника" },
  { code: "41", label: "У місті відправника (локальна доставка)" },
  { code: "5", label: "Прямує до міста отримувача" },
  { code: "6", label: "У місті отримувача, очікується прибуття на відділення" },
  { code: "7", label: "Прибуло на відділення" },
  { code: "8", label: "Прибуло на відділення" },
  { code: "9", label: "Отримано" },
  { code: "10", label: "Отримано (зі СМС-повідомленням, переказ коштів на стійці)" },
  { code: "11", label: "Отримано (переказ коштів видано отримувачу)" },
  { code: "14", label: "Передано отримувачу для перевірки" },
  { code: "101", label: "Прямує до отримувача (кур'єром)" },
  { code: "102", label: "Відмова отримувача" },
  { code: "103", label: "Відмова отримувача" },
  { code: "104", label: "Адресу змінено" },
  { code: "105", label: "Зберігання зупинено" },
  { code: "106", label: "Оформлено зворотну накладну повернення" },
  { code: "108", label: "Відмова отримувача" },
];
