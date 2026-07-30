import { index, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { products } from "./products";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const tags = pgTable(
  "tags",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tags_tenant_label_key").on(table.tenantId, table.label),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

// tenant_id тут навмисно денормалізований (виводиться з product_id/tag_id), щоб буквально
// виконати правило "кожна прикладна таблиця має tenant_id" і щоб RLS-політика не залежала від join.
export const productTags = pgTable(
  "product_tags",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.tagId] }),
    index("product_tags_tenant_tag_idx").on(table.tenantId, table.tagId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
