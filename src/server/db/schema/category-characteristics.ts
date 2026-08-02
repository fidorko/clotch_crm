import { integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { categories } from "./categories";

// "Закріплення характеристик" (settings → сторінка категорії, вкладка
// "Характеристики" — drag&drop, за зразком-макетом людини): які характеристики
// з групи "Характеристики товару"/"Системні" (Кольори/Тип тканини та матеріал/
// Інструкція по догляду/кожен тип "Розмірів"/"Замірів" окремо/довільні
// custom_characteristics/Виробники/Постачальники/Країна бренду/Країна
// виготовлення) закріплені за цією категорією, і в якому порядку (position —
// порядок карток у правій панелі, той самий, що вийшов з drag&drop).
// characteristicKey — той самий "довільний стабільний рядок", що dictionaryKey
// у reference_dictionary_flags: "colors" / "fabric-materials" /
// "care-instructions" / "custom:<uuid>" / "size-type:<uuid>" /
// "measurement-type:<uuid>" / "reference-item:manufacturers" /
// "reference-item:brand-country" / "reference-item:country-of-origin" /
// "suppliers" — "Країна бренду"/"Країна виготовлення" два окремих ключі з
// одного довідника reference_items (kind="countries"), products-characteristics.md.
//
// Рядок = "ця характеристика закріплена за цією категорією" — саме́ значення
// (не окремі "притаманні значення", того рівня деталізації свідомо позбулись
// за макетом людини — попап "+N" лише переглядає значення, нічого не вимикає).
// Успадкування — "останнє редагування виграє, каскадом униз": збереження
// списку на категорії одразу перезаписує той самий список у ВСІХ її нащадків
// (setCategoryPinnedCharacteristics, cascadeToCategoryIds) — включно з тими,
// що раніше мали власний, відмінний список. Товари самі нічого не зберігають —
// картка товару читає список напряму з `category_id` товару (products-
// characteristics.md), тож каскад до товарів відбувається сам собою. Категорія
// без жодного власного рядка (ніхто в її ланцюжку предків ще не зберігав)
// показує список найближчого предка (resolveCategoryPinnedCharacteristics) —
// це лише fallback для незайманих категорій, не основна модель успадкування.
export const categoryCharacteristics = pgTable(
  "category_characteristics",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    characteristicKey: text("characteristic_key").notNull(),
    position: integer("position").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.categoryId, table.characteristicKey] }),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
