import { index, integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { products } from "./products";

// Значення динамічних характеристик товару (картка товару, вкладка «Основне»)
// — той самий принцип характеристикKey, що category_characteristics: "colors" /
// "fabric-materials" / "care-instructions" / "custom:<uuid>" /
// "reference-item:manufacturers" / "reference-item:brand-country" /
// "reference-item:country-of-origin" / "suppliers".
// На практиці тут ніколи не буває "colors"/"suppliers"/"size-type:*"/
// "measurement-type:*" — ці мають власний UI (SKU-конструктор, панель
// метаданих, вкладка «Розміри та заміри») і виключені з динамічної секції
// характеристик, modules/products.md.
//
// valueId — id з відповідної джерельної таблиці (custom_characteristic_values /
// care_instructions / fabric_types / reference_items). Без FK — той самий
// компроміс, що characteristicKey у category_characteristics: одна колонка не
// може посилатись на 4 різні таблиці одразу.
//
// Рядок = "товар має це значення для цієї характеристики". Більшість
// характеристик — одне значення (один рядок на характеристику), «Інструкція по
// догляду» — множинний вибір (кілька рядків з тим самим characteristicKey).
// Для "fabric-materials" тут лише сам обраний тип тканини (fabric_types.id) —
// відсоткова розкладка матеріалів окремо, product-material-composition.ts.
export const productCharacteristicValues = pgTable(
  "product_characteristic_values",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    characteristicKey: text("characteristic_key").notNull(),
    valueId: uuid("value_id").notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({
      columns: [table.tenantId, table.productId, table.characteristicKey, table.valueId],
    }),
    index("product_characteristic_values_tenant_product_idx").on(table.tenantId, table.productId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
