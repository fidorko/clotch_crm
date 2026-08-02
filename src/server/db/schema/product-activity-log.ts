import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { products } from "./products";

// Журнал подій товару — вкладка «Технічні дані» (modules/products.md):
// "created" пишеться разово при створенні товару (createProduct), "updated" —
// по одному рядку на кожне ЗМІНЕНЕ поле при автозбереженні (saveProduct
// діфить проти рядка в БД перед update, рядки одного збереження діляють
// однаковий occurredAt). Постачання/Продажі (номер поставки/замовлення) НЕ
// додано зараз — відповідних модулів (roadmap.md) ще нема в проєкті, лишається
// на майбутнє (decisions.md) — не вигадувати поля під неіснуючі сутності.
export const productActivityEventEnum = pgEnum("product_activity_event", ["created", "updated"]);

export const productActivityLog = pgTable(
  "product_activity_log",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    eventType: productActivityEventEnum("event_type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    // TODO(auth): display-name текстом, той самий тимчасовий підхід, що products.created_by/updated_by.
    actorName: text("actor_name").notNull(),
    fieldKey: text("field_key"),
    fieldLabel: text("field_label"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
  },
  (table) => [
    index("product_activity_log_tenant_product_idx").on(
      table.tenantId,
      table.productId,
      table.occurredAt
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
