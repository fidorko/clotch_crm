import { boolean, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// 3 перемикачі (CRM/вітрина/фільтри) для довідників групи "Характеристики
// товару", які НЕ є custom_characteristics (там ці ж 3 колонки — просто
// колонки на самій характеристиці) — зараз це "colors" і "fabric-materials",
// єдині два довідники цієї групи з реальними даними поза custom_characteristics.
// Одна маленька генерична тенант-скоупована таблиця замість колонок на colors
// (яка про КОЖЕН колір, не про сам довідник як ціле) чи ще одної спеціальної
// таблиці на кожен випадок.
export const referenceDictionaryFlags = pgTable(
  "reference_dictionary_flags",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    dictionaryKey: text("dictionary_key").notNull(),
    showInCrm: boolean("show_in_crm").notNull().default(true),
    showOnStorefront: boolean("show_on_storefront").notNull().default(true),
    participatesInFilters: boolean("participates_in_filters").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.dictionaryKey] }),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
