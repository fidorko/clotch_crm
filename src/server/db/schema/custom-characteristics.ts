import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Довідники, які власник магазину створює сам у рантаймі ("+ Додати довідник"
// на плитках "Характеристики товару") — на відміну від reference_items (kind —
// фіксований TS/pg-enum, задається в коді), тут назва характеристики й самі
// значення повністю довільні, тенант-конфігуровані. Саме тому — ДВІ таблиці
// (характеристика + її значення), а не ще один enum-варіант: enum не можна
// поповнювати з коду застосунку без DDL-міграції на кожну нову характеристику,
// а тут людина сама створює скільки завгодно характеристик без втручання
// розробника й без нових колонок/таблиць під кожну.
export const customCharacteristics = pgTable(
  "custom_characteristics",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    // Стабільний "технічний" ключ (не видимий у UI) для характеристик, від яких
    // залежить інша функціональність застосунку — напр. "tags" для колишньої
    // окремої таблиці tags/product_tags (тепер теж рядок тут, за прямою
    // вказівкою). Дозволяє коду знаходити потрібну характеристику навіть якщо
    // людина перейменує її відображувану назву; NULL — звичайна користувацька
    // характеристика без такої залежності.
    systemKey: text("system_key"),
    showInCrm: boolean("show_in_crm").notNull().default(true),
    showOnStorefront: boolean("show_on_storefront").notNull().default(true),
    participatesInFilters: boolean("participates_in_filters").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("custom_characteristics_tenant_position_idx").on(table.tenantId, table.position),
    unique("custom_characteristics_tenant_name_key").on(table.tenantId, table.name),
    uniqueIndex("custom_characteristics_tenant_system_key_key")
      .on(table.tenantId, table.systemKey)
      .where(sql`${table.systemKey} is not null`),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

export const customCharacteristicValues = pgTable(
  "custom_characteristic_values",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    characteristicId: uuid("characteristic_id")
      .notNull()
      .references(() => customCharacteristics.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("custom_characteristic_values_tenant_characteristic_position_idx").on(
      table.tenantId,
      table.characteristicId,
      table.position
    ),
    unique("custom_characteristic_values_tenant_characteristic_value_key").on(
      table.tenantId,
      table.characteristicId,
      table.value
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
