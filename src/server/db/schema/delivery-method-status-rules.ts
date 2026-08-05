import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { deliveryMethods } from "./delivery-methods";
import { orderStatuses } from "./order-statuses";

// «Автоматичні дії» способу доставки — «При статусі перевізника X → змінити
// статус замовлення на Y» (settings-delivery.md). carrierStatus — вільний
// текст (статуси перевізника не живуть фіксованим enum у нашій БД — у Нової
// пошти їх багато й вони не наші дані), orderStatusId — FK на наш довідник
// order_statuses. Рядків може бути 0..N на спосіб доставки (декілька правил).
// Лише конфігурація — сама перевірка/застосування правила (webhook/поллінг
// статусу перевізника) не реалізована на цьому проході.
export const deliveryMethodStatusRules = pgTable(
  "delivery_method_status_rules",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    deliveryMethodId: uuid("delivery_method_id")
      .notNull()
      .references(() => deliveryMethods.id, { onDelete: "cascade" }),
    carrierStatus: text("carrier_status").notNull(),
    orderStatusId: uuid("order_status_id").references(() => orderStatuses.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("delivery_method_status_rules_method_position_idx").on(
      table.tenantId,
      table.deliveryMethodId,
      table.position
    ),
    unique("delivery_method_status_rules_method_status_key").on(
      table.tenantId,
      table.deliveryMethodId,
      table.carrierStatus
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
