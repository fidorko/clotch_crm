import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

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
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("materials_tenant_position_idx").on(table.tenantId, table.position),
    unique("materials_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
