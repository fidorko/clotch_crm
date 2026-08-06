import { boolean, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Тенант-конфігурований довідник способів доставки (settings → Доставка).
// Один рядок на carrier_key — спільний для всього тенанта (список), НЕ
// дублюється на кожну юридичну особу. Уся конфігурація, специфічна для
// конкретного ФОП/ТОВ (API-ключ, відправник, платник тощо) — окрема таблиця
// delivery-method-entity-settings.ts, по одному рядку на пару
// (спосіб доставки, юридична особа). Пряма вказівка людини (2026-08-06,
// сьомий прохід): "способи доставки то одні на тенанта, а от налаштування
// різні" — settings-delivery.md.
export const deliveryMethods = pgTable(
  "delivery_methods",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    carrierKey: text("carrier_key").notNull(),
    name: text("name").notNull(),
    requiresApiKey: boolean("requires_api_key").notNull().default(true),
    isEnabled: boolean("is_enabled").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("delivery_methods_tenant_position_idx").on(table.tenantId, table.position),
    unique("delivery_methods_tenant_carrier_key_key").on(table.tenantId, table.carrierKey),
    unique("delivery_methods_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
