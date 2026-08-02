import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Глобальна таблиця — виняток із правила "tenant_id скрізь" (розділ 6 CLAUDE.md),
// бо це сам довідник тенантів, на який усі інші таблиці посилаються через tenant_id.
// Мінімальний склад: авторизації/керування тенантами ще нема (див. docs/db.md).
//
// RLS увімкнено БЕЗ жодної policy (на відміну від прикладних таблиць —
// tenantIsolationPolicy тут не застосовна, немає власного tenant_id) — це
// свідомо fail-closed deny-all для будь-якої non-owner ролі: застосунок ніколи
// не читає tenants через app_user (лише FK-посилання з інших таблиць), тож
// функціонал не зачіпається. Потрібно через Supabase, де публічна схема
// автоматично видається назовні через PostgREST (Data API) — таблиця без RLS
// без цього була б читана/записувана будь-ким через anon/authenticated ролі
// Supabase, попри те що застосунок цим API взагалі не користується.
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
).enableRLS();
