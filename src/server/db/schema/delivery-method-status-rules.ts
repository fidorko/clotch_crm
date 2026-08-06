import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { deliveryMethodEntitySettings } from "./delivery-method-entity-settings";
import { orderStatuses } from "./order-statuses";

// «Автоматичні дії» способу доставки — «При статусі перевізника X → змінити
// статус замовлення на Y» (settings-delivery.md). carrierStatus — вільний
// текст (статуси перевізника не живуть фіксованим enum у нашій БД — у Нової
// пошти їх багато й вони не наші дані), orderStatusId — FK на наш довідник
// order_statuses. Рядків може бути 0..N на конфігурацію способу доставки.
// 2026-08-06, сьомий прохід — прив'язка перенесена з deliveryMethodId на
// entitySettingsId: правило належить конкретній парі (спосіб, юридична
// особа), не способу доставки взагалі (кожен ФОП відстежує статуси свого
// кабінету перевізника окремо). Лише конфігурація — сама перевірка/
// застосування правила (webhook/поллінг статусу перевізника) не реалізована.
export const deliveryMethodStatusRules = pgTable(
  "delivery_method_status_rules",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    entitySettingsId: uuid("entity_settings_id")
      .notNull()
      .references(() => deliveryMethodEntitySettings.id, { onDelete: "cascade" }),
    carrierStatus: text("carrier_status").notNull(),
    orderStatusId: uuid("order_status_id").references(() => orderStatuses.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("delivery_method_status_rules_entity_settings_position_idx").on(
      table.tenantId,
      table.entitySettingsId,
      table.position
    ),
    unique("delivery_method_status_rules_entity_settings_status_key").on(
      table.tenantId,
      table.entitySettingsId,
      table.carrierStatus
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
