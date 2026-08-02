import { pgEnum, pgTable, primaryKey, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Тенант-рівневий (НЕ per-товар) розподіл динамічних характеристик по двох
// панелях картки товару (ProductInfoPanel/ProductMetaPanel) + порядок у межах
// панелі — режим "редагувати layout" прямо на картці товару (drag&drop між
// панелями, @dnd-kit), modules/products.md. Рядка нема для characteristicKey =
// дефолт (панель "info", у кінці списку) — так само, як категорія без власного
// рядка в category_characteristics = "успадковано", тут просто "не
// переставляли ще". Категорія (ProductInfoPanel) і Постачальник
// (ProductMetaPanel) сюди не входять — фіксовані, за прямою вказівкою людини.
export const characteristicPanelEnum = pgEnum("characteristic_panel", ["info", "meta"]);

export const productCharacteristicLayout = pgTable(
  "product_characteristic_layout",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    characteristicKey: text("characteristic_key").notNull(),
    panel: characteristicPanelEnum("panel").notNull().default("info"),
    position: integer("position").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.characteristicKey] }),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
