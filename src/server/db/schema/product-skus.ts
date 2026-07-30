import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./products";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const productSkus = pgTable(
  "product_skus",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    color: text("color").notNull(),
    colorHex: text("color_hex").notNull(),
    size: text("size").notNull(),
    barcode: text("barcode"),
    stock: integer("stock").notNull().default(0),
    // Відомий розрив: тип ProductSku.cell — одна комірка, тоді як мок selectedSku.cells
    // показує розбивку залишку по кількох комірках з кількістю. Перший прохід БД лишає
    // одну комірку на SKU 1:1 з поточним TS-типом (див. db.md).
    cell: text("cell"),
    // Per-SKU override цін із ProductInfoPanel (nullable = успадковує ціну товару).
    purchasePriceOverride: numeric("purchase_price_override", { precision: 12, scale: 2 }),
    retailPriceOverride: numeric("retail_price_override", { precision: 12, scale: 2 }),
    oldPriceOverride: numeric("old_price_override", { precision: 12, scale: 2 }),
    wholesalePriceOverride: numeric("wholesale_price_override", { precision: 12, scale: 2 }),
    dropshipPriceOverride: numeric("dropship_price_override", { precision: 12, scale: 2 }),
    retailDiscountOverride: numeric("retail_discount_override", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_skus_tenant_product_idx").on(table.tenantId, table.productId),
    uniqueIndex("product_skus_tenant_code_key").on(table.tenantId, table.code),
    uniqueIndex("product_skus_tenant_barcode_key")
      .on(table.tenantId, table.barcode)
      .where(sql`${table.barcode} is not null`),
    check("product_skus_stock_nonneg", sql`${table.stock} >= 0`),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
