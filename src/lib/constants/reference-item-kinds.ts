// Список kind тут МАЄ збігатися з масивом значень reference_item_kind enum у
// server/db/schema/reference-items.ts (там — окремий літерал, схемні файли не
// імпортують з lib/, той самий підхід, що й решта schema/*.ts).
export const REFERENCE_ITEM_KINDS = [
  "collections",
  "seasons",
  "fabric-materials",
  "manufacturers",
  "brands",
  "countries",
  "currencies",
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
  currencies: "Валюти",
  units: "Одиниці виміру",
  fit: "Посадка",
};

export function isReferenceItemKind(value: string): value is ReferenceItemKind {
  return (REFERENCE_ITEM_KINDS as readonly string[]).includes(value);
}
