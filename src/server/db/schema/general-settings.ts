import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Той самий формат рядка годин роботи, що warehouses.workHours
// (WarehouseWorkHourEntry) — не дублюємо тип окремо, форма перевикористовує
// WarehouseWorkHoursField напряму (ui-kit.md, правило 9.2).
export interface GeneralSettingsWorkHourEntry {
  id: string;
  label: string;
  isDayOff: boolean;
  from: string;
  to: string;
}

// Один рядок на тенанта (settings → Загальні) — tenant_id сам є PK, окремий
// uuid id не потрібен: це singleton-налаштування магазину, не список.
// upsertGeneralSettings (server/data/general-settings.ts) створює рядок при
// першому збереженні; до того getGeneralSettings повертає null.
export const generalSettings = pgTable(
  "general_settings",
  {
    tenantId: uuid("tenant_id")
      .primaryKey()
      .references(() => tenants.id),
    name: text("name"),
    website: text("website"),
    email: text("email"),
    contactPersonName: text("contact_person_name"),
    contactPersonPosition: text("contact_person_position"),
    // Нормалізовано +380XXXXXXXXX, без пробілів (conventions.md, "Формати вводу").
    contactPersonPhone: text("contact_person_phone"),
    workHours: jsonb("work_hours").$type<GeneralSettingsWorkHourEntry[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [tenantIsolationPolicy(table.tenantId)]
).enableRLS();
