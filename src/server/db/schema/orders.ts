import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { companyLegalEntities } from "./company-legal-entities";
import { customers } from "./customers";
import { deliveryMethods } from "./delivery-methods";
import { paymentMethods } from "./payment-methods";
import { paymentStatuses } from "./payment-statuses";
import { productSkus } from "./product-skus";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { warehouses } from "./warehouses";

// Перший реальний бек модуля "Замовлення" (orders.md) — форма /orders/new.
// Значення orderStatusEnum навмисно збігаються з хардкод-типом OrderStatus
// (lib/types/orders.ts) — той самий пайплайн, продуманий раніше для мок-
// списку /orders; сам список ще НЕ переведено на цю таблицю (open item).
export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "returned",
]);
export const orderSourceEnum = pgEnum("order_source", [
  "instagram",
  "website",
  "telegram",
  "phone",
  "olx",
]);
// Знижка (на рядок товару й на замовлення в цілому, orders-new-order-form.md,
// другий прохід редизайну) — % чи фіксована сума, той самий вибір, що PriceModeRow.
export const orderDiscountTypeEnum = pgEnum("order_discount_type", ["percent", "amount"]);

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
    // Юридична особа замовлення (обов'язкове поле форми, другий прохід
    // редизайну) — визначає, чиї налаштування delivery_method_entity_settings
    // використовує доставка/ЕН (раніше — хардкод "перша юрособа тенанта").
    legalEntityId: uuid("legal_entity_id")
      .notNull()
      .references(() => companyLegalEntities.id),
    status: orderStatusEnum("status").notNull().default("new"),
    // Статус ОПЛАТИ — реальний тенант-керований довідник payment_statuses
    // (другий прохід редизайну, пряма вказівка людини), не хардкод-enum.
    // ON DELETE SET NULL — той самий підхід, що deliveryMethodId: видалення
    // довідникового значення не повинно ламати вже створене замовлення.
    paymentStatusId: uuid("payment_status_id")
      .notNull()
      .references(() => paymentStatuses.id, { onDelete: "set null" }),
    // payment_method — денормалізований знімок назви на момент замовлення
    // (як product_name в order_items); paymentMethodId — реальний FK, звідки
    // береться kind для авто-логіки (передоплата/часткова/накладений платіж).
    paymentMethod: text("payment_method"),
    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id, { onDelete: "set null" }),
    source: orderSourceEnum("source").notNull().default("website"),
    managerName: text("manager_name"), // TODO(auth): DEV_USER.name, той самий підхід що products.createdBy
    createdByName: text("created_by_name"), // TODO(auth): DEV_USER.name — "Користувач що створив замовлення"
    totalSum: numeric("total_sum", { precision: 12, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    itemsNote: text("items_note"), // «Примітка до товарів» (під таблицею позицій)

    // date, не timestamp — «Дата замовлення»/«Очікувана дата відвантаження»
    // редагуються через DatePicker (DD.MM.YYYY), той самий тип, що
    // receiving_documents.plannedDate.
    orderDate: date("order_date").notNull().default(sql`CURRENT_DATE`),
    expectedShipmentDate: date("expected_shipment_date").notNull().default(sql`CURRENT_DATE`),

    // Знижка на замовлення в цілому (Підсумок) — окремо від знижки на рядок
    // товару (order_items.discountType/discountValue нижче).
    discountType: orderDiscountTypeEnum("discount_type"),
    discountValue: numeric("discount_value", { precision: 12, scale: 2 }),
    // Вільний текст, без реальної таблиці правил/валідації промокодів (не
    // просили) — «Застосувати» лише зберігає введений текст.
    promoCode: text("promo_code"),

    // Склад відвантаження — один на все замовлення (не по рядку), реальний
    // FK на warehouses; повноцінна модель залишків по складах — окрема
    // майбутня задача (warehouses.isPrimary — лише дефолтний вибір у Select).
    warehouseId: uuid("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),

    // Пакування Нової пошти (третій прохід редизайну, пряма вказівка людини —
    // "зроби вибір пакування") — usePackaging true, коли обрано конкретний
    // вид (packagingRef заповнено); packagingRef/packagingName — реальний
    // NpPackItem з getPackList(), впливає на вартість через OptionsSeat у
    // getDocumentPrice (shipments.md).
    usePackaging: boolean("use_packaging").notNull().default(false),
    packagingRef: text("packaging_ref"),
    packagingName: text("packaging_name"),

    // Вага/габарити/місця — раніше лише транзиторні поля форми (ніде не
    // зберігались після створення ЕН), тепер реальні колонки: дефолт —
    // сума з карток товару (products.packageWeightKg/...), редаговані.
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
    packageLengthCm: smallint("package_length_cm"),
    packageWidthCm: smallint("package_width_cm"),
    packageHeightCm: smallint("package_height_cm"),
    seatsAmount: integer("seats_amount").notNull().default(1),
    declaredValue: numeric("declared_value", { precision: 12, scale: 2 }),
    shipmentDescription: text("shipment_description"),

    // «Сума післяплати» / «До оплати клієнтом» — рахується сервером із kind
    // способу оплати (0 при передоплаті, залишок при частковій, повна сума
    // при накладеному платежі). НЕ надсилається у createShipment цим
    // проходом — реальний NP-параметр BackwardDeliveryData не звірений з
    // документацією (docs/carriers/novaposhta/shipments.md, «Відкрито»).
    codAmount: numeric("cod_amount", { precision: 12, scale: 2 }),
    // Результат «Розрахувати вартість доставки» (calculate()) або ручний
    // ввід — окремо від carrierCostOnSite (факт ПІСЛЯ реального createShipment).
    deliveryCost: numeric("delivery_cost", { precision: 12, scale: 2 }),

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
    // Адресна доставка (третій прохід — "Адреса" як реальний тип НП),
    // заповнюється замість recipientWarehouseRef/recipientWarehouse, коли
    // отримувач обирає доставку "до дверей", не на відділення/поштомат.
    recipientStreetRef: text("recipient_street_ref"),
    recipientStreet: text("recipient_street"),
    recipientHouseNumber: text("recipient_house_number"),
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
    // Знижка на рядок (Товари, редизайн, другий прохід) — окремо від знижки
    // на замовлення в цілому (orders.discountType/discountValue).
    discountType: orderDiscountTypeEnum("discount_type"),
    discountValue: numeric("discount_value", { precision: 12, scale: 2 }),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_items_tenant_order_idx").on(table.tenantId, table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
