import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { suppliers } from "./suppliers";

// Кілька контактних осіб на постачальника — delete-then-insert при кожному
// збереженні форми (той самий патерн, що syncProductTags у server/data/products.ts).
export const supplierContacts = pgTable(
  "supplier_contacts",
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
    name: text("name").notNull(),
    jobTitle: text("job_title"),
    phone: text("phone"),
    email: text("email"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("supplier_contacts_tenant_supplier_idx").on(table.tenantId, table.supplierId, table.position),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
