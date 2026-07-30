import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Глобальна таблиця — виняток із правила "tenant_id скрізь" (розділ 6 CLAUDE.md),
// бо це сам довідник тенантів, на який усі інші таблиці посилаються через tenant_id.
// Мінімальний склад: авторизації/керування тенантами ще нема (див. docs/db.md).
export const tenants = pgTable("tenants", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
