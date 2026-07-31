import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const currencySymbolPositionEnum = pgEnum("currency_symbol_position", ["before", "after"]);

// Тенант-конфігурований довідник валют (settings → Довідники → Валюти) — не в
// спільній reference_items (той довідник лише для "просто назва"): валюті
// потрібні код/символ/позиція/знаки після коми/курс/автооновлення. Раніше
// "currencies" був у REFERENCE_ITEM_KINDS — значення лишається валідним у
// pg-enum reference_item_kind назавжди (Postgres не вміє DROP VALUE з enum),
// але з lib/constants/reference-item-kinds.ts прибрано, нових записів з таким
// kind більше не створюється.
export const currencies = pgTable(
  "currencies",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    code: text("code").notNull(), // ISO 4217, напр. "UAH"
    name: text("name").notNull(),
    symbol: text("symbol").notNull().default(""),
    symbolPosition: currencySymbolPositionEnum("symbol_position").notNull().default("after"),
    decimalPlaces: smallint("decimal_places").notNull().default(2),
    isActive: boolean("is_active").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    // Курс відносно базової (is_default=true) валюти тенанта; для самої базової
    // завжди NULL (курс до самої себе = 1, зберігати нема сенсу).
    exchangeRate: numeric("exchange_rate", { precision: 14, scale: 6 }),
    rateUpdatedAt: timestamp("rate_updated_at", { withTimezone: true }),
    // За задумом — увімкнено за замовчуванням (кожна нова валюта тягне курс з НБУ).
    autoUpdate: boolean("auto_update").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("currencies_tenant_position_idx").on(table.tenantId, table.position),
    unique("currencies_tenant_code_key").on(table.tenantId, table.code),
    // Частковий UNIQUE — лише одна валюта за замовчуванням на тенанта; сам факт
    // існування обмеження на рівні БД (не лише в коді) — той самий підхід, що
    // product_skus_tenant_barcode_key (partial UNIQUE WHERE ...).
    uniqueIndex("currencies_tenant_default_key")
      .on(table.tenantId)
      .where(sql`${table.isDefault} = true`),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
