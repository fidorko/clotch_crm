import { date, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { suppliers } from "./suppliers";
import { warehouses } from "./warehouses";

export const receivingDocumentTypeEnum = pgEnum("receiving_document_type", ["planned", "actual"]);
export const receivingDocumentStatusEnum = pgEnum("receiving_document_status", [
  "draft",
  "expected",
  "posted",
]);
export const receivingTtnCarrierEnum = pgEnum("receiving_ttn_carrier", ["nova_poshta", "ukrposhta"]);

// Документ надходження (заголовок) — перший реальний бекенд для
// warehouse-receiving.md (третій прохід планового надходження). Позиції
// (SKU/кількості) поки НЕ мають власної таблиці — автозберігається лише
// заголовок форми, warehouse-receiving.md.
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
    type: receivingDocumentTypeEnum("type").notNull(),
    status: receivingDocumentStatusEnum("status").notNull().default("draft"),
    // Фактичне надходження, створене з планового — id планового документа.
    // Без FK-обмеження (самопосилання в drizzle вимагає окремого workaround,
    // а звʼязок поки ніде не проставляється автоматично — TODO).
    basedOnId: uuid("based_on_id"),
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
