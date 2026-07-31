import { index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Тримати синхронно з REFERENCE_ITEM_KINDS у lib/constants/reference-item-kinds.ts
// (schema/*.ts тут навмисно не імпортує з lib/, як і решта файлів схеми).
export const referenceItemKindEnum = pgEnum("reference_item_kind", [
  "collections",
  "seasons",
  "fabric-materials",
  "manufacturers",
  "brands",
  "countries",
  "currencies",
  "units",
  "fit",
]);

// Один спільний довідник для "просто назва" типів (Колекції/Сезон/Тип тканини/
// Виробники/Бренди/Країни/Валюти/Одиниці виміру/Посадка) — замість окремої
// таблиці на кожен. "Інструкція по догляду" (потрібна ще й іконка на запис) і
// "Розміри та заміри" (не лише назви, а й сама розмірна сітка) сюди свідомо не
// увійшли — інша форма даних. "Теги" вже мають власну таблицю (tags) — теж не тут.
export const referenceItems = pgTable(
  "reference_items",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    kind: referenceItemKindEnum("kind").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reference_items_tenant_kind_position_idx").on(table.tenantId, table.kind, table.position),
    unique("reference_items_tenant_kind_name_key").on(table.tenantId, table.kind, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
