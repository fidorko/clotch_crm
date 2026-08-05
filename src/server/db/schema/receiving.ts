import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { suppliers } from "./suppliers";
import { warehouses } from "./warehouses";
import { productSkus } from "./product-skus";

// Один документ на надходження, не пара planned+actual (decisions.md,
// 2026-08-05) — is_planned (нижче) лише вмикає проміжний awaiting_delivery,
// статус завжди рухається по цьому самому рядку: awaiting_delivery (лише
// коли isPlanned — до «Прийняти на склад») → in_progress → completed /
// completed_with_discrepancy (розбіжність план/факт — лише для isPlanned).
export const receivingDocumentStatusEnum = pgEnum("receiving_document_status", [
  "awaiting_delivery",
  "in_progress",
  "completed",
  "completed_with_discrepancy",
]);
export const receivingTtnCarrierEnum = pgEnum("receiving_ttn_carrier", ["nova_poshta", "ukrposhta"]);

// Документ надходження (заголовок) — перший реальний бекенд для
// warehouse-receiving.md (третій прохід планового надходження). Позиції
// (SKU/кількості) — таблиця receivingDocumentItems нижче (восьмий прохід).
export const receivingDocuments = pgTable(
  "receiving_documents",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    // RCV-2026-001... — генерується сервером, той самий патерн, що
    // generateWarehouseCode (server/data/warehouses.ts).
    number: text("number").notNull(),
    // Статус завжди виставляється явно кодом (create/accept/complete в
    // server/data/receiving.ts) — без default, щоб не було жодного шляху
    // отримати рядок у невідповідному стані мовчки.
    status: receivingDocumentStatusEnum("status").notNull(),
    // Один документ на надходження, не пара planned+actual (decisions.md,
    // 2026-08-05) — фіксується раз при створенні, ніколи не редагується.
    isPlanned: boolean("is_planned").notNull().default(false),
    // Момент «Зберегти документ надходження та завершити» — наявність
    // значення = документ заблокований для будь-якого редагування.
    completedAt: timestamp("completed_at", { withTimezone: true }),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    warehouseId: uuid("warehouse_id").references(() => warehouses.id),
    plannedDate: date("planned_date"),
    supplierDocument: text("supplier_document"),
    ttnCarrier: receivingTtnCarrierEnum("ttn_carrier"),
    ttnNumber: text("ttn_number"),
    // Немає таблиці користувачів/авторизації (TODO(auth)) — поки вільний текст.
    responsiblePerson: text("responsible_person"),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("receiving_documents_tenant_created_idx").on(table.tenantId, table.createdAt),
    unique("receiving_documents_tenant_number_key").on(table.tenantId, table.number),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

// Довільні пари "назва поля - значення" на документі надходження (людина
// сама називає поле) — той самий принцип, що supplier_custom_fields
// (server/db/schema/supplier-custom-fields.ts), лише прив'язка до
// документа надходження замість постачальника.
export const receivingDocumentCustomFields = pgTable(
  "receiving_document_custom_fields",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    documentId: uuid("document_id")
      .notNull()
      .references(() => receivingDocuments.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    value: text("value"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("receiving_document_custom_fields_tenant_document_idx").on(
      table.tenantId,
      table.documentId,
      table.position
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

// Позиції (SKU + кількості) одного надходження — восьмий прохід
// (warehouse-receiving.md): раніше жили лише в useState браузера й
// губились при перезавантаженні, тепер реальна таблиця. Без денормалізованих
// полів (назва/колір/розмір/ШК/фото) — усе джойниться живцем з
// productSkus+products, той самий принцип, що listProductSkusCatalog
// (server/data/product-skus.ts).
export const receivingDocumentItems = pgTable(
  "receiving_document_items",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    documentId: uuid("document_id")
      .notNull()
      .references(() => receivingDocuments.id, { onDelete: "cascade" }),
    // Без onDelete — SKU, що колись фігурував у надходженні, видалити не
    // можна (той самий навмисний RESTRICT-за-замовчуванням, що supplierId/
    // warehouseId на receivingDocuments вище).
    productSkuId: uuid("product_sku_id")
      .notNull()
      .references(() => productSkus.id),
    ordered: integer("ordered").notNull().default(0),
    // Реально прийнята кількість — єдине місце в проєкті, де змінюється
    // product_skus.stock (server/data/receiving-items.ts), тому й тут
    // окрема, не похідна від ordered, колонка.
    received: integer("received").notNull().default(0),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("receiving_document_items_tenant_document_idx").on(
      table.tenantId,
      table.documentId,
      table.position
    ),
    // Повторний скан/вибір того самого SKU оновлює наявний рядок
    // (ON CONFLICT DO UPDATE), не плодить дублі.
    unique("receiving_document_items_tenant_document_sku_key").on(
      table.tenantId,
      table.documentId,
      table.productSkuId
    ),
    check("receiving_document_items_ordered_nonneg", sql`${table.ordered} >= 0`),
    check("receiving_document_items_received_nonneg", sql`${table.received} >= 0`),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

// Лог кожної зміни received (не ordered — лише прийняте відбувається в
// реальний фізичний момент, коли постачальник довідправляє частинами
// різними днями, і саме ці дати треба зберегти). Append-only, без UI зараз
// (пряма вказівка людини) — лише пишеться під час приймання.
export const receivingDocumentItemEvents = pgTable(
  "receiving_document_item_events",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    itemId: uuid("item_id")
      .notNull()
      .references(() => receivingDocumentItems.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("receiving_document_item_events_tenant_item_idx").on(
      table.tenantId,
      table.itemId,
      table.createdAt
    ),
    check("receiving_document_item_events_delta_nonzero", sql`${table.delta} <> 0`),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
