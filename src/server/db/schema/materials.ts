import { index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Невеликий фіксований набір категорій матеріалу (той самий підхід, що
// fabric_stretch/fabric_season у fabric-types.ts — розробник задає значення,
// не людина через попап). UI-групування/фільтр за категорією поки не
// побудовано (не просили) — колонка лише зберігає дані, `modules/settings.md`.
export const materialCategoryEnum = pgEnum("material_category", [
  "natural",
  "cellulose",
  "synthetic",
  "leather",
  "fur",
  "rubber",
  "other",
]);

// Довідник матеріалів (settings → Довідники → Тип тканини та матеріал →
// вкладка "Матеріали") — з нього обираються значення в "Типовому складі" й
// "Можливих матеріалах" тканини (fabric-types.ts). Той самий патерн, що colors:
// назва + колір-зразок (тут — суто ілюстративний, не змінює жодну бізнес-логіку).
export const materials = pgTable(
  "materials",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    color: text("color"),
    category: materialCategoryEnum("category"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("materials_tenant_position_idx").on(table.tenantId, table.position),
    unique("materials_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
