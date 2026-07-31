import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Довідник «Розміри» (settings → Довідники → «Розміри та заміри», вкладка
// «Розміри») — тенант сам додає типи розмірів (напр. «Одяг (літерні)»,
// «Взуття», «Джинси», «Бюстгальтери») і список значень у кожному. Просто
// довідник (два рівні "тип -> значення"), без таблиці замірів — на відміну
// від колишньої (видаленої) `sizes`, тут немає жодних числових колонок.
export const sizeTypes = pgTable(
  "size_types",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("size_types_tenant_position_idx").on(table.tenantId, table.position),
    unique("size_types_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

// Значення в межах типу розміру (напр. тип «Взуття» -> "35","36","37"...).
// Нічого зовнішнього не посилається на конкретний рядок значення, тож
// збереження — delete-then-insert усього набору (той самий патерн, що
// дочірні колекції suppliers), діф не потрібен.
export const sizeValues = pgTable(
  "size_values",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    sizeTypeId: uuid("size_type_id")
      .notNull()
      .references(() => sizeTypes.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("size_values_tenant_type_idx").on(table.tenantId, table.sizeTypeId, table.position),
    unique("size_values_tenant_type_value_key").on(table.tenantId, table.sizeTypeId, table.value),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
