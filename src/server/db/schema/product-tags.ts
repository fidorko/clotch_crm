import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { products } from "./products";
import { customCharacteristicValues } from "./custom-characteristics";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// tenant_id тут навмисно денормалізований (виводиться з product_id/characteristic_value_id),
// щоб буквально виконати правило "кожна прикладна таблиця має tenant_id" і щоб
// RLS-політика не залежала від join.
//
// Раніше tagId посилався на окрему таблицю tags. За прямою вказівкою теги
// товару перенесено в custom_characteristics/custom_characteristic_values
// (характеристика з system_key="tags") — той самий спільний механізм, що й
// решта користувацьких довідників (db.md/decisions.md). Значення тегу
// видаляється разом із characteristic_value (ON DELETE CASCADE) — товари
// лишаються, лише без цього тегу.
export const productTags = pgTable(
  "product_tags",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    characteristicValueId: uuid("characteristic_value_id")
      .notNull()
      .references(() => customCharacteristicValues.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.characteristicValueId] }),
    index("product_tags_tenant_characteristic_value_idx").on(table.tenantId, table.characteristicValueId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
