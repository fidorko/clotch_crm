import {
  index,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const productStatusEnum = pgEnum("product_status", ["active", "inactive", "archived"]);
export const priceModeEnum = pgEnum("price_mode", ["amount", "percent"]);

export const products = pgTable(
  "products",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    // category — коротка назва ("Футболки"), categoryPath — повний шлях довідника категорій.
    category: text("category").notNull(),
    categoryPath: text("category_path").notNull(),
    status: productStatusEnum("status").notNull().default("active"),
    modelCode: text("model_code").notNull(),
    brand: text("brand").notNull(),
    collection: text("collection"),
    season: text("season"),
    // info.*
    gender: text("gender"),
    seasonType: text("season_type"),
    fit: text("fit"),
    countryOfOrigin: text("country_of_origin"),
    manufacturer: text("manufacturer"),
    material: text("material"),
    fabricType: text("fabric_type"),
    description: text("description"),
    // pricing — плоскі колонки, не jsonb (див. decisions.md: потрібні WHERE/ORDER BY, набір полів фіксований)
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
    oldPrice: numeric("old_price", { precision: 12, scale: 2 }),
    retailMode: priceModeEnum("retail_mode").notNull().default("amount"),
    retailAmount: numeric("retail_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    retailPercent: numeric("retail_percent", { precision: 5, scale: 2 }).notNull().default("0"),
    wholesaleMode: priceModeEnum("wholesale_mode").notNull().default("amount"),
    wholesaleAmount: numeric("wholesale_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    wholesalePercent: numeric("wholesale_percent", { precision: 5, scale: 2 }).notNull().default("0"),
    dropshipMode: priceModeEnum("dropship_mode").notNull().default("amount"),
    dropshipAmount: numeric("dropship_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    dropshipPercent: numeric("dropship_percent", { precision: 5, scale: 2 }).notNull().default("0"),
    retailDiscountMode: priceModeEnum("retail_discount_mode").notNull().default("percent"),
    retailDiscountAmount: numeric("retail_discount_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    retailDiscountPercent: numeric("retail_discount_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    // meta.*
    supplier: text("supplier"),
    brandCountry: text("brand_country"),
    internalCode: text("internal_code"),
    supplierCode: text("supplier_code"),
    packageLengthCm: smallint("package_length_cm"),
    packageWidthCm: smallint("package_width_cm"),
    packageHeightCm: smallint("package_height_cm"),
    packageWeightKg: numeric("package_weight_kg", { precision: 6, scale: 2 }),
    createdBy: text("created_by"), // TODO(auth): FK на users(id), поки display-name текстом
    updatedBy: text("updated_by"), // TODO(auth): те саме
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("products_tenant_created_idx").on(table.tenantId, table.createdAt),
    index("products_tenant_status_idx").on(table.tenantId, table.status),
    unique("products_tenant_model_code_key").on(table.tenantId, table.modelCode),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
