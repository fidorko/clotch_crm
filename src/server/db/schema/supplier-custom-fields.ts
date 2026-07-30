import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { suppliers } from "./suppliers";

// Довільні пари "назва поля - значення" в блоці адреси (людина сама називає поле).
export const supplierCustomFields = pgTable(
  "supplier_custom_fields",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    value: text("value"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("supplier_custom_fields_tenant_supplier_idx").on(table.tenantId, table.supplierId, table.position),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
