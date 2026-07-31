// Список kind тут МАЄ збігатися з масивом значень reference_item_kind enum у
// server/db/schema/reference-items.ts (там — окремий літерал, схемні файли не
// імпортують з lib/, той самий підхід, що й решта schema/*.ts).
// "currencies"/"collections"/"seasons"/"brands"/"fit" тут НЕМАЄ навмисно —
// перші отримали власну таблицю (colors/currencies), решта перенесено в
// custom_characteristics за прямою вказівкою (той самий механізм, що й
// довільні користувацькі довідники — db.md/decisions.md). "fabric-materials"
// теж прибрано — отримав власний виділений маршрут і таблиці (fabric_types +
// materials + care_instructions, db.md), значно багатший за "просто назва".
// Значення лишаються валідними в pg-enum reference_item_kind (Postgres не вміє
// DROP VALUE), але не використовуються.
export const REFERENCE_ITEM_KINDS = ["manufacturers", "countries", "units"] as const;

export type ReferenceItemKind = (typeof REFERENCE_ITEM_KINDS)[number];

export const REFERENCE_ITEM_KIND_LABELS: Record<ReferenceItemKind, string> = {
  manufacturers: "Виробники",
  countries: "Країни",
  units: "Одиниці виміру",
};

export function isReferenceItemKind(value: string): value is ReferenceItemKind {
  return (REFERENCE_ITEM_KINDS as readonly string[]).includes(value);
}
