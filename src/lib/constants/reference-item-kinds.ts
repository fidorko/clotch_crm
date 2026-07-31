// Список kind тут МАЄ збігатися з масивом значень reference_item_kind enum у
// server/db/schema/reference-items.ts (там — окремий літерал, схемні файли не
// імпортують з lib/, той самий підхід, що й решта schema/*.ts).
// "currencies" тут НЕМАЄ навмисно — валюти отримали власну таблицю (schema/currencies.ts,
// потребують коду/символу/курсу, не просто назву), значення "currencies" лишається
// в pg-enum reference_item_kind (Postgres не вміє DROP VALUE), але не використовується.
export const REFERENCE_ITEM_KINDS = [
  "collections",
  "seasons",
  "fabric-materials",
  "manufacturers",
  "brands",
  "countries",
  "units",
  "fit",
] as const;

export type ReferenceItemKind = (typeof REFERENCE_ITEM_KINDS)[number];

export const REFERENCE_ITEM_KIND_LABELS: Record<ReferenceItemKind, string> = {
  collections: "Колекції",
  seasons: "Сезон",
  "fabric-materials": "Тип тканини та матеріал",
  manufacturers: "Виробники",
  brands: "Бренди",
  countries: "Країни",
  units: "Одиниці виміру",
  fit: "Посадка",
};

export function isReferenceItemKind(value: string): value is ReferenceItemKind {
  return (REFERENCE_ITEM_KINDS as readonly string[]).includes(value);
}
