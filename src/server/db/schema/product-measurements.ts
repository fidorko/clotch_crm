import { index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { products } from "./products";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const productMeasurements = pgTable(
  "product_measurements",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Копія лейбла з lib/constants/measurement-types.ts, НЕ FK — довідник типів замірів
    // свідомо не нормалізований у цьому проході (див. db.md).
    type: text("type").notNull(),
    valueCm: numeric("value_cm", { precision: 6, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_measurements_tenant_product_idx").on(table.tenantId, table.productId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
