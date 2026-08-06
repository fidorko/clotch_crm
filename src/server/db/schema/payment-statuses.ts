import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Системний довідник статусів ОПЛАТИ (settings → Довідники → Системні,
// orders-new-order-form.md) — той самий патерн, що order_statuses (назва+
// колір), без полів сповіщення (не просили тут). НЕ пов'язаний з orders.status
// (пайплайн доставки/комплектації, лишається окремим хардкод-enum) — це лише
// стан "заплатив/не заплатив" на конкретному замовленні (orders.paymentStatusId).
export const paymentStatuses = pgTable(
  "payment_statuses",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    color: text("color").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payment_statuses_tenant_position_idx").on(table.tenantId, table.position),
    unique("payment_statuses_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
