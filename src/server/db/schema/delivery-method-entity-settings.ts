import { boolean, index, integer, numeric, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { deliveryMethods } from "./delivery-methods";
import { companyLegalEntities } from "./company-legal-entities";

export const deliveryMethodPayerEnum = pgEnum("delivery_method_payer", [
  "sender",
  "recipient",
  "third_party",
]);
export const deliveryMethodDeclaredValueModeEnum = pgEnum("delivery_method_declared_value_mode", [
  "order_amount",
  "minimum_amount",
]);
export const deliveryMethodDescriptionContentEnum = pgEnum("delivery_method_description_content", [
  "order_id",
  "product_sku",
  "product_names",
]);
export const deliveryMethodSenderAddressTypeEnum = pgEnum("delivery_method_sender_address_type", [
  "warehouse",
  "address",
]);
export const deliveryMethodMarkingPrinterTypeEnum = pgEnum("delivery_method_marking_printer_type", [
  "thermal",
  "regular",
]);

// Конфігурація способу доставки для КОНКРЕТНОЇ юридичної особи (2026-08-06,
// сьомий прохід — пряма вказівка людини: "способи доставки то одні на
// тенанта, а от налаштування різні", кожен ФОП/ТОВ має власний кабінет
// перевізника, ключ, відправника, реквізити). Раніше все це лежало плоско на
// delivery_methods (одна конфігурація на тенанта) — перенесено сюди без
// зміни семантики полів, лише додано прив'язку до legal_entity_id. Один
// рядок на пару (спосіб доставки, юридична особа); за прямою вказівкою
// людини кожен новостворений ФОП/ТОВ одразу отримує по рядку на кожен
// наявний спосіб доставки, порожній (companyLegalEntities.ts,
// createCompanyLegalEntityAction).
export const deliveryMethodEntitySettings = pgTable(
  "delivery_method_entity_settings",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    deliveryMethodId: uuid("delivery_method_id")
      .notNull()
      .references(() => deliveryMethods.id, { onDelete: "cascade" }),
    legalEntityId: uuid("legal_entity_id")
      .notNull()
      .references(() => companyLegalEntities.id, { onDelete: "cascade" }),

    // apiKey — тенантський ключ інтеграції перевізника САМЕ ЦІЄЇ юридичної
    // особи (бізнес-дані, не інфраструктурний секрет застосунку — conventions.md
    // §"Секрети" тут не застосовується), nullable: не в кожного способу
    // доставки він потрібен (самовивіз).
    apiKey: text("api_key"),

    // Відправник за замовчуванням — той самий підхід, що раніше на
    // delivery_methods (Counterparty.getCounterparties/getCounterpartyContactPersons,
    // Address.getCities/getWarehouses/getStreet). *Ref — справжній Ref з
    // відповіді API, інше поле — кешована копія людського опису на момент
    // вибору.
    senderCounterpartyRef: text("sender_counterparty_ref"),
    senderCounterparty: text("sender_counterparty"),
    senderContactPersonRef: text("sender_contact_person_ref"),
    senderContactPerson: text("sender_contact_person"),
    senderPhone: text("sender_phone"), // нормалізовано +380XXXXXXXXX (conventions.md)
    senderAddressType: deliveryMethodSenderAddressTypeEnum("sender_address_type")
      .notNull()
      .default("warehouse"),
    senderCityRef: text("sender_city_ref"),
    senderCity: text("sender_city"),
    senderWarehouseRef: text("sender_warehouse_ref"),
    senderAddressOrWarehouse: text("sender_address_or_warehouse"),
    senderStreetRef: text("sender_street_ref"),
    senderStreet: text("sender_street"),
    senderHouseNumber: text("sender_house_number"),

    payer: deliveryMethodPayerEnum("payer").notNull().default("recipient"),

    declaredValueMode: deliveryMethodDeclaredValueModeEnum("declared_value_mode")
      .notNull()
      .default("order_amount"),
    declaredValueMinimum: numeric("declared_value_minimum", { precision: 12, scale: 2 }).default("500"),

    descriptionContent: deliveryMethodDescriptionContentEnum("description_content")
      .notNull()
      .default("product_names"),
    descriptionIncludeQuantity: boolean("description_include_quantity").notNull().default(true),

    syncFrequencyMinutes: integer("sync_frequency_minutes"),
    orderReturnOnRefusal: boolean("order_return_on_refusal").notNull().default(false),

    useCarrierPackaging: boolean("use_carrier_packaging").notNull().default(false),

    markingPrinterType: deliveryMethodMarkingPrinterTypeEnum("marking_printer_type")
      .notNull()
      .default("regular"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("delivery_method_entity_settings_tenant_method_idx").on(table.tenantId, table.deliveryMethodId),
    index("delivery_method_entity_settings_tenant_entity_idx").on(table.tenantId, table.legalEntityId),
    unique("delivery_method_entity_settings_method_entity_key").on(
      table.tenantId,
      table.deliveryMethodId,
      table.legalEntityId
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
