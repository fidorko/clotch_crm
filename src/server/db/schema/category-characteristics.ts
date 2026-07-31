import { integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { categories } from "./categories";

// "Закріплення характеристик" (settings → сторінка категорії, вкладка
// "Характеристики" — drag&drop, за зразком-макетом людини): які характеристики
// з групи "Характеристики товару"/"Системні" (Кольори/Тип тканини та матеріал/
// Інструкція по догляду/кожен тип "Розмірів"/"Замірів" окремо/довільні
// custom_characteristics/Виробники/Постачальники/Країни) закріплені за цією
// категорією, і в якому порядку (position — порядок карток у правій панелі,
// той самий, що вийшов з drag&drop). characteristicKey — той самий "довільний
// стабільний рядок", що dictionaryKey у reference_dictionary_flags: "colors" /
// "fabric-materials" / "care-instructions" / "custom:<uuid>" /
// "size-type:<uuid>" / "measurement-type:<uuid>" / "reference-item:manufacturers"
// / "reference-item:countries" / "suppliers".
//
// Рядок = "ця характеристика закріплена за цією категорією" — саме́ значення
// (не окремі "притаманні значення", того рівня деталізації свідомо позбулись
// за макетом людини — попап "+N" лише переглядає значення, нічого не вимикає).
// Категорія успадковує весь список закріплених характеристик від найближчого
// предка, доки НЕ має жодного власного рядка — щойно з'явився хоч один власний
// рядок (будь-яка дія в drag&drop — додати/прибрати/переставити пише повний
// список наново), категорія більше не залежить від подальших правок батька.
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
