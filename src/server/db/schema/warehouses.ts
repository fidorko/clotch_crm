import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
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

// Роздільник між рівнями адреси комірки (WarehouseBinLocationsTab), спільний
// pure-хелпер для показу й реальної генерації — src/lib/warehouse/bin-address.ts.
export const warehouseBinSeparatorEnum = pgEnum("warehouse_bin_separator", [
  "space",
  "dash",
  "slash",
  "none",
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
    // Структура адрес (вкладка «Адресне зберігання») — рівень-формат зберігає
    // ЗРАЗОК стартового значення: цифровий рядок ("101"/"01") — стартове число
    // й ширина падінгу нулями, буквений ("A") — стартова літера, послідовність
    // Excel-стилем (A..Z, AA..). Парсинг — src/lib/warehouse/bin-address.ts,
    // спільний для клієнтського превью й реальної генерації на сервері.
    binLevel1Name: text("bin_level1_name").notNull().default("Вулиця"),
    binLevel2Name: text("bin_level2_name").notNull().default("Стелаж"),
    binLevel3Name: text("bin_level3_name").notNull().default("Комірка"),
    binLevel1Format: text("bin_level1_format").notNull().default("101"),
    binLevel2Format: text("bin_level2_format").notNull().default("A"),
    binLevel3Format: text("bin_level3_format").notNull().default("01"),
    binSeparator: warehouseBinSeparatorEnum("bin_separator").notNull().default("space"),
    binGenerateBarcodes: boolean("bin_generate_barcodes").notNull().default(true),
    binGenerateQr: boolean("bin_generate_qr").notNull().default(false),
    binAllowLabelReprint: boolean("bin_allow_label_reprint").notNull().default(true),
    // Останні використані параметри генератора (Блок 3) — щоб форма
    // відкривалась з попередніми числами, не порожня щоразу; nullable, поки
    // жодного разу не генерували.
    binStreetsCount: integer("bin_streets_count"),
    binRacksPerStreet: integer("bin_racks_per_street"),
    binCellsPerRack: integer("bin_cells_per_rack"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("warehouses_tenant_created_idx").on(table.tenantId, table.createdAt),
    unique("warehouses_tenant_code_key").on(table.tenantId, table.code),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
