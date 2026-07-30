import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { suppliers } from "./suppliers";

export const supplierChannelKindEnum = pgEnum("supplier_channel_kind", ["messenger", "social"]);

// channel — вільний текст ("telegram"/"viber"/"whatsapp"/"facebook"/"instagram"/
// "tiktok"/"threads"), не enum: фіксований набір живе в UI-довіднику
// (lib/constants/supplier-channels.ts), не є окремою БД-сутністю.
export const supplierChannels = pgTable(
  "supplier_channels",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    kind: supplierChannelKindEnum("kind").notNull(),
    channel: text("channel").notNull(),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("supplier_channels_tenant_supplier_idx").on(table.tenantId, table.supplierId, table.position),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
