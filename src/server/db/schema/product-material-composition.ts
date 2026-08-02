import { index, integer, numeric, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { products } from "./products";
import { materials } from "./materials";

// Розкладка складу тканини товару ("Тип тканини та матеріал" — обраний тип
// зберігається окремо, product-characteristic-values.ts, characteristicKey
// "fabric-materials"). Тут — власне склад: матеріал (з "можливих матеріалів"
// обраного типу, fabric_type_possible_materials) + відсоток, напр. "бавовна
// 90%, синтетика 10%". materialId — реальний FK (на відміну від generic-таблиці
// вище тут завжди одна конкретна таблиця-джерело), position — порядок рядків.
export const productMaterialComposition = pgTable(
  "product_material_composition",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    percent: numeric("percent", { precision: 5, scale: 2 }).notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.productId, table.materialId] }),
    index("product_material_composition_tenant_product_idx").on(table.tenantId, table.productId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
