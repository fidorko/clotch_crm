import { boolean, index, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const supplierTypeEnum = pgEnum("supplier_type", [
  "manufacturer",
  "distributor",
  "wholesaler",
  "importer",
  "other",
]);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    // Генерується сервером (SUP-0001...), користувач не вводить — server/data/suppliers.ts.
    code: text("code").notNull(),
    type: supplierTypeEnum("type").notNull().default("other"),
    isActive: boolean("is_active").notNull().default(true),
    website: text("website"),
    country: text("country"),
    city: text("city"),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("suppliers_tenant_created_idx").on(table.tenantId, table.createdAt),
    unique("suppliers_tenant_code_key").on(table.tenantId, table.code),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
