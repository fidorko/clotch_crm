import { sql } from "drizzle-orm";
import { check, index, integer, numeric, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { deliveryMethods } from "./delivery-methods";
import { productSkus } from "./product-skus";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

// Перший реальний бек модуля "Замовлення" (orders.md) — форма /orders/new.
// Значення enum-ів навмисно збігаються з хардкод-типами lib/types/orders.ts
// (OrderStatus/PaymentStatus/OrderSource) — той самий пайплайн, продуманий
// раніше для мок-списку /orders; сам список ще НЕ переведено на цю таблицю
// (open item, orders.md) — нове замовлення поки не зʼявляється в /orders.
export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "returned",
]);
export const orderPaymentStatusEnum = pgEnum("order_payment_status", [
  "unpaid",
  "partial",
  "paid",
  "refunded",
]);
export const orderSourceEnum = pgEnum("order_source", [
  "instagram",
  "website",
  "telegram",
  "phone",
  "olx",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    number: text("number").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    status: orderStatusEnum("status").notNull().default("new"),
    paymentStatus: orderPaymentStatusEnum("payment_status").notNull().default("unpaid"),
    paymentMethod: text("payment_method"),
    source: orderSourceEnum("source").notNull().default("website"),
    managerName: text("manager_name"), // TODO(auth): DEV_USER.name, той самий підхід що products.createdBy
    totalSum: numeric("total_sum", { precision: 12, scale: 2 }).notNull().default("0"),
    notes: text("notes"),

    // Доставка/ЕН — знімок на момент оформлення (спосіб доставки/тариф міг
    // згодом змінитись у settings, замовлення лишається з тим, що було
    // реально вибрано й відправлено в Нову пошту).
    deliveryMethodId: uuid("delivery_method_id").references(() => deliveryMethods.id, { onDelete: "set null" }),
    recipientName: text("recipient_name"),
    recipientPhone: text("recipient_phone"), // нормалізовано +380XXXXXXXXX (conventions.md)
    recipientCityRef: text("recipient_city_ref"),
    recipientCity: text("recipient_city"),
    recipientWarehouseRef: text("recipient_warehouse_ref"),
    recipientWarehouse: text("recipient_warehouse"),
    // ttn/carrierShipmentRef — реальний результат InternetDocument.save
    // (docs/carriers/novaposhta/shipments.md). carrierEstimatedDeliveryDate —
    // кешований текст відповіді перевізника (не канонічна дата застосунку,
    // conventions.md — той самий підхід, що senderCity в delivery-methods.ts).
    ttn: text("ttn"),
    carrierShipmentRef: text("carrier_shipment_ref"),
    carrierCostOnSite: numeric("carrier_cost_on_site", { precision: 12, scale: 2 }),
    carrierEstimatedDeliveryDate: text("carrier_estimated_delivery_date"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("orders_tenant_created_idx").on(table.tenantId, table.createdAt),
    index("orders_tenant_status_idx").on(table.tenantId, table.status),
    index("orders_tenant_customer_idx").on(table.tenantId, table.customerId),
    unique("orders_tenant_number_key").on(table.tenantId, table.number),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

// Позиції замовлення — знімок товару на момент продажу (назва/SKU/колір/
// розмір/ціна копіюються, не читаються наживо з products/product_skus —
// картка товару могла змінитись чи товар видалитись пізніше). productSkuId
// nullable + ON DELETE SET NULL, той самий патерн, що products.categoryId —
// видалення SKU не повинно стирати історію замовлення.
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productSkuId: uuid("product_sku_id").references(() => productSkus.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    color: text("color").notNull(),
    size: text("size").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_items_tenant_order_idx").on(table.tenantId, table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
