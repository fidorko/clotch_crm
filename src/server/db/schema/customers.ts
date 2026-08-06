import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Клієнти CRM (orders.md — перший реальний бек модуля "Замовлення", пряма
// вказівка людини: форма нового замовлення отримує реальні orders/customers/
// order_items замість моків). phone — нормалізовано +380XXXXXXXXX
// (conventions.md), унікальний у межах тенанта — один номер = один клієнт.
export const customers = pgTable(
  "customers",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    comment: text("comment"), // «Коментар клієнта» (orders-new-order-form.md, редизайн)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("customers_tenant_created_idx").on(table.tenantId, table.createdAt),
    unique("customers_tenant_phone_key").on(table.tenantId, table.phone),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
