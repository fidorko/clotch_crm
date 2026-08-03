import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { products } from "./products";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { bytea } from "./custom-types";

// Фото прив'язане до кольору товару, не до окремого SKU — на колір завжди
// припадає кілька SKU (по одному на кожен розмір), і фото моделі в цьому
// кольорі однакове для всіх розмірів. "color" — вільний текст (та сама
// копія значення, що й product_skus.color, не FK — db.md).
export const productColorPhotos = pgTable(
  "product_color_photos",
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
    color: text("color").notNull(),
    data: bytea("data").notNull(),
    mimeType: text("mime_type").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_color_photos_tenant_product_color_idx").on(
      table.tenantId,
      table.productId,
      table.color,
      table.position
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
