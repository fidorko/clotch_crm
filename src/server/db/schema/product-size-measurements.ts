import { numeric, pgTable, primaryKey, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { products } from "./products";
import { measurementValues } from "./measurement-types";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Замінює product_measurements (пласкій список замірів на весь товар, без
// розміру — decisions.md). Значення тепер на перетині "розмір × точка заміру":
// size — вільний текст, той самий рядок, що product_skus.size (розміри товару
// й так не FK, decisions.md — тут той самий компроміс); measurementValueId —
// реальний FK на measurement_values (тут, на відміну від product_skus.size й
// колишнього product_measurements.type, джерело точок заміру ОДНЕ, тому FK
// без багатоджерельної неоднозначності доречний).
export const productSizeMeasurements = pgTable(
  "product_size_measurements",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    measurementValueId: uuid("measurement_value_id")
      .notNull()
      .references(() => measurementValues.id, { onDelete: "cascade" }),
    valueCm: numeric("value_cm", { precision: 6, scale: 2 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.productId, table.size, table.measurementValueId] }),
    index("product_size_measurements_tenant_product_idx").on(table.tenantId, table.productId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
