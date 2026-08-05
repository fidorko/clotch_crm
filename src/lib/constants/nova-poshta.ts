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
