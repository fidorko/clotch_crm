import {
  boolean,
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
import { categories } from "./categories";
import { suppliers } from "./suppliers";

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
    // category/categoryPath — вільний текст (стара схема, дубльована для сумісності з UI,
    // напр. хлібні крихти в ProductHeader). categoryId — реальний зв'язок із деревом
    // categories (settings), звідки й береться кількість товарів на категорію.
    // ON DELETE SET NULL — видалення категорії не повинно блокуватись через товари,
    // на відміну від categories.parent_id (там RESTRICT — інша семантика, розділ db.md).
    category: text("category").notNull(),
    categoryPath: text("category_path").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    status: productStatusEnum("status").notNull().default("active"),
    // Чернетка (створена кнопкою "Додати товар") — картка товару показує "Створити
    // товар" замість "Редагувати" й зберігає всю форму одним запитом, поки true.
    isDraft: boolean("is_draft").notNull().default(false),
    modelCode: text("model_code").notNull(),
    season: text("season"),
    // gender — єдине поле старої "info.*" групи без реального довідника (не
    // частина системи динамічних характеристик), лишається вільним текстом.
    // brand/collection/seasonType/fit/countryOfOrigin/manufacturer/material/
    // fabricType перенесено в product_characteristic_values (+ material —
    // product_material_composition) — це були хардкод-копії значень, не
    // прив'язані до жодного довідника, db.md.
    gender: text("gender"),
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
    // Перемикач "Ціна та маржа" (ProductPricingPanel): true (за замовч.) — ціна
    // однакова для всіх розмірів SKU, SKUDetail не показує override-поля цін
    // узагалі; false — кожен SKU може мати власну ціну (override-поля видимі).
    sameSizePricing: boolean("same_size_pricing").notNull().default(true),
    // meta.* — supplierId: реальний FK на suppliers (settings → Довідники), не вільний
    // текст (як раніше "supplier"). ON DELETE SET NULL, той самий патерн, що categoryId.
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    // brandCountry (колишній "Країна бренду") перенесено в
    // product_characteristic_values разом із "Країна виготовлення" — обидва
    // тепер динамічні поля з одного довідника reference_items (kind="countries").
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
    index("products_tenant_category_idx").on(table.tenantId, table.categoryId),
    unique("products_tenant_model_code_key").on(table.tenantId, table.modelCode),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
