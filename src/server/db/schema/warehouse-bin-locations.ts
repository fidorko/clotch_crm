import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { warehouses } from "./warehouses";

// Адресне зберігання (WarehouseBinExplorer) — 3 таблиці батько→нащадок
// (той самий принцип, що size_types/size_values): вулиця/стелаж/комірка
// створюються КОЖНА ОКРЕМО, по одній чи партією, не крос-добутком.
// Видалення каскадне через ON DELETE CASCADE в ланцюжку — сам Postgres
// зносить стелажі й комірки під видаленою вулицею, без рекурсії в коді.
export const warehouseBinStreets = pgTable(
  "warehouse_bin_streets",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("warehouse_bin_streets_tenant_warehouse_idx").on(table.tenantId, table.warehouseId),
    unique("warehouse_bin_streets_tenant_warehouse_value_key").on(
      table.tenantId,
      table.warehouseId,
      table.value
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

export const warehouseBinRacks = pgTable(
  "warehouse_bin_racks",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    // Денормалізовано (як і раніше в плоскій таблиці) — прямі запити по
    // складу без join через street_id.
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    streetId: uuid("street_id")
      .notNull()
      .references(() => warehouseBinStreets.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("warehouse_bin_racks_tenant_street_idx").on(table.tenantId, table.streetId),
    unique("warehouse_bin_racks_tenant_street_value_key").on(table.tenantId, table.streetId, table.value),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

export const warehouseBinCells = pgTable(
  "warehouse_bin_cells",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    rackId: uuid("rack_id")
      .notNull()
      .references(() => warehouseBinRacks.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    // Повна складена адреса (вулиця+стелаж+комірка через роздільник складу) —
    // те саме значення йде і в друк (текст на етикетці), і в штрихкод.
    code: text("code").notNull(),
    // Значення, що кодується в реальний Code128 (bin-label-pdf.ts) — завжди
    // = code, окрема колонка про запас (як product_skus.barcode).
    barcode: text("barcode").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("warehouse_bin_cells_tenant_rack_idx").on(table.tenantId, table.rackId),
    index("warehouse_bin_cells_tenant_warehouse_idx").on(table.tenantId, table.warehouseId),
    unique("warehouse_bin_cells_tenant_rack_value_key").on(table.tenantId, table.rackId, table.value),
    unique("warehouse_bin_cells_tenant_warehouse_code_key").on(table.tenantId, table.warehouseId, table.code),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
