import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const deliveryMethodPayerEnum = pgEnum("delivery_method_payer", [
  "sender",
  "recipient",
  "third_party",
]);
export const deliveryMethodDeclaredValueModeEnum = pgEnum("delivery_method_declared_value_mode", [
  "order_amount",
  "minimum_amount",
]);
export const deliveryMethodPackagingEnum = pgEnum("delivery_method_packaging", [
  "none",
  "carrier_packaging",
  "own_packaging",
]);
export const deliveryMethodDescriptionContentEnum = pgEnum("delivery_method_description_content", [
  "order_id",
  "product_sku",
  "product_names",
]);

// Тенант-конфігурований довідник способів доставки (settings → Доставка).
// carrierKey — стабільний slug ("pickup"/"nova_poshta"/"ukrposhta"/"meest_express"
// для стартових 4, або згенерований з назви для довільних, доданих тенантом).
// apiKey — тенантський ключ інтеграції перевізника (бізнес-дані тенанта, не
// інфраструктурний секрет застосунку — conventions.md §"Секрети" про нього не йдеться),
// nullable: не в кожного способу доставки він потрібен (самовивіз).
//
// 2026-08-05, другий прохід (пряма вказівка людини) — розширені налаштування
// перевізника: не всі поля тут є буквально в API Нової пошти, частина — суто
// CRM-конфігурація (settings-delivery.md). Усі нові поля nullable/з розумним
// дефолтом і застосовуються лише коли requiresApiKey=true (самовивіз їх не
// показує в UI, хоч колонки й спільні для всіх рядків таблиці).
export const deliveryMethods = pgTable(
  "delivery_methods",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    carrierKey: text("carrier_key").notNull(),
    name: text("name").notNull(),
    requiresApiKey: boolean("requires_api_key").notNull().default(true),
    apiKey: text("api_key"),
    isEnabled: boolean("is_enabled").notNull().default(false),
    position: integer("position").notNull().default(0),

    // Відправник за замовчуванням (2026-08-05, третій прохід — пряма вказівка
    // людини: тягнути реальними даними з API Нової пошти по ключу тенанта, не
    // вільним текстом). *Ref — справжній Ref з відповіді Counterparty/Address
    // API (Counterparty.getCounterparties/getCounterpartyContactPersons,
    // Address.getCities/getWarehouses), інше поле — кешована копія людського
    // опису на момент вибору (той самий підхід, що product_skus.color/color_hex,
    // db.md) — щоб показати значення без повторного живого виклику API. Для
    // перевізників без реальної інтеграції (Укрпошта/Meest, чи довільний
    // доданий тенантом спосіб) UI лишає вільний ввід у ці самі текстові колонки.
    senderCounterpartyRef: text("sender_counterparty_ref"),
    senderCounterparty: text("sender_counterparty"),
    senderContactPersonRef: text("sender_contact_person_ref"),
    senderContactPerson: text("sender_contact_person"),
    senderPhone: text("sender_phone"), // нормалізовано +380XXXXXXXXX (conventions.md)
    senderCityRef: text("sender_city_ref"),
    senderCity: text("sender_city"),
    senderWarehouseRef: text("sender_warehouse_ref"),
    senderAddressOrWarehouse: text("sender_address_or_warehouse"),

    // Тип доставки можливий — реальні комбінації CommonGeneral.getServiceTypes
    // (перевірено живим викликом 2026-08-05): DoorsDoors/DoorsWarehouse/
    // WarehouseWarehouse/WarehouseDoors/DoorsPostomat (lib/constants/nova-poshta.ts,
    // тримати синхронно вручну — той самий підхід, що REFERENCE_ITEM_KINDS,
    // db.md). За замовчуванням усі 5 увімкнені (пряма вказівка).
    allowedServiceTypes: text("allowed_service_types")
      .array()
      .notNull()
      .default(["DoorsDoors", "DoorsWarehouse", "WarehouseWarehouse", "WarehouseDoors", "DoorsPostomat"]),
    payer: deliveryMethodPayerEnum("payer").notNull().default("recipient"),

    declaredValueMode: deliveryMethodDeclaredValueModeEnum("declared_value_mode")
      .notNull()
      .default("order_amount"),
    // Дробове число (conventions.md) — DecimalInput на формі, крапка в БД.
    // Значуще лише коли declaredValueMode = "minimum_amount".
    declaredValueMinimum: numeric("declared_value_minimum", { precision: 12, scale: 2 }).default("500"),

    // Опис відправлення (поле "Опис вантажу" на ЕН) — що саме туди підставляти
    // автоматично: ID замовлення / артикул товару / назви товарів + окремо
    // чи додавати кількість. Лише конфігурація (settings-delivery.md) — сам
    // автоматичний збір опису при створенні ЕН не реалізований.
    descriptionContent: deliveryMethodDescriptionContentEnum("description_content")
      .notNull()
      .default("product_names"),
    descriptionIncludeQuantity: boolean("description_include_quantity").notNull().default(true),

    // Автоматичні дії — лише конфігурація. syncFrequencyMinutes: фонового job
    // нема. orderReturnOnRefusal: НЕ автоматика (пряма вказівка людини,
    // 2026-08-05, третій прохід — "автоматичного повернення немає, але
    // замовити повернення по API можна") — вмикач лише дозволяє дію
    // "оформити повернення" в майбутньому UI замовлення; сам виклик API
    // (реальний ендпоінт повернення Нової пошти) ще не реалізований. Назва
    // колонки в БД лишилась "auto_return_on_refusal" (без міграції-перейменування,
    // ambiguous-rename prompt drizzle-kit вимагає TTY) — це деталь БД, не
    // видима людині; JS-назва поля виправлена.
    syncFrequencyMinutes: integer("sync_frequency_minutes"),
    orderReturnOnRefusal: boolean("auto_return_on_refusal").notNull().default(false),

    packaging: deliveryMethodPackagingEnum("packaging").notNull().default("none"),
    // Значуще лише коли packaging = "carrier_packaging" — конкретна позиція з
    // реального CommonGeneral.getPackList (Ref+кешований опис, той самий
    // підхід, що поля відправника вище).
    packRef: text("pack_ref"),
    packDescription: text("pack_description"),

    labelFormat: text("label_format"),
    waybillFormat: text("waybill_format"),
    printerName: text("printer_name"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("delivery_methods_tenant_position_idx").on(table.tenantId, table.position),
    unique("delivery_methods_tenant_carrier_key_key").on(table.tenantId, table.carrierKey),
    unique("delivery_methods_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
