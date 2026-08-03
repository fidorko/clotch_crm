import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { warehouses } from "./warehouses";

// Реально згенеровані комірки складу (WarehouseBinLocationsTab, «Генератор
// комірок»). code — повна адреса, складена level1+level2+level3 через
// роздільник (src/lib/warehouse/bin-address.ts, той самий хелпер, що й
// клієнтський попередній перегляд). UNIQUE(tenant_id, warehouse_id, code) —
// повторна генерація з тим самим чи ширшим діапазоном тільки додає нові
// (onConflictDoNothing), наявні комірки не чіпає й не дублює.
export const warehouseBinLocations = pgTable(
  "warehouse_bin_locations",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    level1Value: text("level1_value").notNull(),
    level2Value: text("level2_value").notNull(),
    level3Value: text("level3_value").notNull(),
    // Штрихкод/QR — значення, що кодується (поки що = code, той самий підхід,
    // що product_skus.barcode: просто унікальний текстовий рядок, без
    // реального рендеру символіки Code128 на сервері). NULL, якщо відповідну
    // опцію було вимкнено на момент генерації цієї комірки.
    barcode: text("barcode"),
    qrPayload: text("qr_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("warehouse_bin_locations_tenant_warehouse_idx").on(table.tenantId, table.warehouseId),
    unique("warehouse_bin_locations_tenant_warehouse_code_key").on(
      table.tenantId,
      table.warehouseId,
      table.code
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
