import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Довідник «Заміри» (settings → Довідники → «Розміри та заміри», вкладка
// «Заміри») — та сама форма, що size_types/size_values, окремі таблиці
// (інша семантика: значення тут — назви точок заміру, напр. тип «Заміри
// сукні/блузи» -> "Обхват грудей","Обхват талії"..., не самі розміри).
export const measurementTypes = pgTable(
  "measurement_types",
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
    index("measurement_types_tenant_position_idx").on(table.tenantId, table.position),
    unique("measurement_types_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

export const measurementValues = pgTable(
  "measurement_values",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    measurementTypeId: uuid("measurement_type_id")
      .notNull()
      .references(() => measurementTypes.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("measurement_values_tenant_type_idx").on(table.tenantId, table.measurementTypeId, table.position),
    unique("measurement_values_tenant_type_value_key").on(table.tenantId, table.measurementTypeId, table.value),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
