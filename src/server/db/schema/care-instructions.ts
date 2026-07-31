import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Довідник пунктів догляду (settings → Довідники → Тип тканини та матеріал →
// картка "Рекомендації по догляду" на типі тканини) — реальні тенант-керовані
// записи, не хардкод: назва ("Прання при 30°C") + іконка. `icon` — ключ із
// фіксованого набору кандидатів (lib/constants/care-instruction-icons.ts),
// сама іконка обирається людиною при створенні запису, як колір для Colors.
export const careInstructions = pgTable(
  "care_instructions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("care_instructions_tenant_position_idx").on(table.tenantId, table.position),
    unique("care_instructions_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
