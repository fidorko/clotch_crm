import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    // Самопосилання: коренева категорія = null. onDelete "restrict" — Postgres
    // сам блокує видалення батьківської, поки в неї є діти (не app-level check).
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    // null = не задано на цій категорії, успадковується від найближчого предка
    // з явним значенням (walk up parentId, lib/categories/inheritance.ts);
    // якщо на всьому ланцюжку нічого не задано — застосунок трактує як true.
    // NOT NULL/default(true) свідомо прибрано — інакше нову категорію
    // неможливо було б відрізнити від "успадковує" (decisions.md).
    isActive: boolean("is_active"),
    showInStorefrontSection: boolean("show_in_storefront_section"),
    showInHeaderMenu: boolean("show_in_header_menu"),
    defaultWeightKg: numeric("default_weight_kg", { precision: 6, scale: 2 }),
    defaultLengthCm: smallint("default_length_cm"),
    defaultWidthCm: smallint("default_width_cm"),
    defaultHeightCm: smallint("default_height_cm"),
    seoH1: text("seo_h1"),
    seoMetaTitle: text("seo_meta_title"),
    seoMetaDescription: text("seo_meta_description"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("categories_tenant_parent_idx").on(table.tenantId, table.parentId),
    index("categories_tenant_created_idx").on(table.tenantId, table.createdAt),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
