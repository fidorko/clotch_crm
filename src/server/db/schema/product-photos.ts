import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { products } from "./products";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const productPhotos = pgTable(
  "product_photos",
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
    url: text("url").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_photos_tenant_product_position_idx").on(
      table.tenantId,
      table.productId,
      table.position
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
