import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const warehouseTypeEnum = pgEnum("warehouse_type", [
  "main",
  "pos",
  "returns",
  "defective",
  "disposal",
  "production",
]);

// Години роботи — гнучкий список довільних груп днів (не 7 фіксованих
// колонок): "Пн-Пт 09:00-18:00", "Сб 09:00-15:00", "Нд Вихідний" тощо,
// людина сама додає/прибирає рядки (WarehouseWorkHoursField). jsonb, бо
// склад одного тенанта не має власної таблиці рядків заради 3-5 записів.
export interface WarehouseWorkHourEntry {
  id: string;
  label: string;
  isDayOff: boolean;
  from: string;
  to: string;
}

export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    // Генерується сервером (WH-0001...), користувач не вводить — server/data/warehouses.ts.
    code: text("code").notNull(),
    type: warehouseTypeEnum("type").notNull().default("main"),
    isActive: boolean("is_active").notNull().default(true),
    responsiblePerson: text("responsible_person"),
    // Нормалізований формат +380XXXXXXXXX, без пробілів (conventions.md, "Формати вводу").
    responsiblePhone: text("responsible_phone"),
    // Країна/валюта — копія значення на момент вибору (назва/код), не FK на
    // reference_items/currencies: той самий принцип, що colors→product_skus
    // і suppliers.country (db.md) — видалення довідникового значення заднім
    // числом не ламає вже створений склад.
    country: text("country"),
    city: text("city"),
    address: text("address"),
    notes: text("notes"),
    workHours: jsonb("work_hours").$type<WarehouseWorkHourEntry[]>().notNull().default([]),
    currencyCode: text("currency_code"),
    canSell: boolean("can_sell").notNull().default(true),
    allowNegativeStock: boolean("allow_negative_stock").notNull().default(false),
    useBinLocations: boolean("use_bin_locations").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("warehouses_tenant_created_idx").on(table.tenantId, table.createdAt),
    unique("warehouses_tenant_code_key").on(table.tenantId, table.code),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
