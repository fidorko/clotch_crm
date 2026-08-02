import { pgTable, primaryKey, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Тенант-рівневий (НЕ per-товар) порядок фіксованих полів на вкладці
// «Технічні дані» картки товару (Створено/Оновлено/Створив/Останній
// редагував/Постачальник/Артикул постачальника/Розміри посилки/Вага посилки)
// — той самий принцип, що product_characteristic_layout, але один список без
// панелей (fieldKey — фіксований набір із lib/products/technical-fields.ts,
// не довільний characteristic_key). Без власного рядка — дефолтний порядок
// (як він історично був на панелі метаданих), modules/products.md.
export const productTechnicalLayout = pgTable(
  "product_technical_layout",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    fieldKey: text("field_key").notNull(),
    position: integer("position").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.fieldKey] }),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
