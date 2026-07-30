import { sql } from "drizzle-orm";
import { pgPolicy, type AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Другий рубіж захисту (crм §6): RLS-політика, що дозволяє рядок лише коли
 * tenant_id збігається зі значенням сесійної змінної app.tenant_id
 * (виставляється в src/server/db/client.ts через withTenant). Власник таблиці
 * (роль, якою котяться міграції) обходить RLS за замовчуванням у Postgres —
 * політика реально діє лише для non-owner ролі застосунку (app_user).
 * missing_ok=true у current_setting: якщо змінну не виставлено — NULL, порівняння
 * хибне, доступ забороняється (fail-closed), а не падає з помилкою.
 */
export function tenantIsolationPolicy(tenantIdColumn: AnyPgColumn) {
  return pgPolicy("tenant_isolation", {
    for: "all",
    using: sql`${tenantIdColumn} = current_setting('app.tenant_id', true)::uuid`,
    withCheck: sql`${tenantIdColumn} = current_setting('app.tenant_id', true)::uuid`,
  });
}
