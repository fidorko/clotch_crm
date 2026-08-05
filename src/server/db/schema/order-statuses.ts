import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Системний довідник статусів замовлень (settings → Довідники → Системні,
// orders.md — сам модуль "Замовлення" ще на моках, довідник статусів
// готується наперед на реальній БД, за прямою вказівкою людини).
// notifyAfterHours/notifyUser — разом або обидва null: якщо задано,
// замовлення в цьому статусі, що не змінилось notifyAfterHours годин,
// повинно сповістити notifyUser (вільний текст — TODO(auth), реальної
// таблиці користувачів ще нема, той самий підхід, що DEV_USER).
export const orderStatuses = pgTable(
  "order_statuses",
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
    notifyAfterHours: integer("notify_after_hours"),
    notifyUser: text("notify_user"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_statuses_tenant_position_idx").on(table.tenantId, table.position),
    unique("order_statuses_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
