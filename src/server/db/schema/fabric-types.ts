import { boolean, index, integer, pgEnum, pgTable, primaryKey, smallint, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { materials } from "./materials";
import { careInstructions } from "./care-instructions";

// Розтяжність і сезон — невеликі фіксовані набори (на відміну від
// custom_characteristics), значення задає розробник, не людина через попап,
// тому звичайний pg-enum, той самий підхід, що supplier_type/currency_symbol_position.
export const fabricStretchEnum = pgEnum("fabric_stretch", ["low", "medium", "high"]);
export const fabricSeasonEnum = pgEnum("fabric_season", ["spring", "summer", "autumn", "winter"]);

// Тип тканини (settings → Довідники → Тип тканини та матеріал → вкладка
// "Типи тканини") — замінює колишній reference_items.kind="fabric-materials"
// (лише назва) значно багатшою карткою: описом, щільністю/розтяжністю/сезоном,
// зображенням схеми тканини, типовим складом і можливими матеріалами (нижче,
// junction-таблиці), рекомендаціями по догляду.
export const fabricTypes = pgTable(
  "fabric_types",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    code: text("code").notNull(),
    description: text("description"),
    density: text("density"),
    stretch: fabricStretchEnum("stretch"),
    recommendedUse: text("recommended_use"),
    schemaImageUrl: text("schema_image_url"),
    schemaNotes: text("schema_notes"),
    isActive: boolean("is_active").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("fabric_types_tenant_position_idx").on(table.tenantId, table.position),
    unique("fabric_types_tenant_name_key").on(table.tenantId, table.name),
    unique("fabric_types_tenant_code_key").on(table.tenantId, table.code),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

// "Типовий склад" — матеріал + типовий відсоток (лише підказка при створенні
// товару, нічого не підсумовує/не валідує суму 100% на рівні БД — conventions.md,
// валідація на сервері, не check-constraint).
export const fabricTypeComposition = pgTable(
  "fabric_type_composition",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    fabricTypeId: uuid("fabric_type_id")
      .notNull()
      .references(() => fabricTypes.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    percent: smallint("percent").notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.fabricTypeId, table.materialId] }),
    index("fabric_type_composition_tenant_fabric_type_idx").on(table.tenantId, table.fabricTypeId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

// "Можливі матеріали" — ширший чекбокс-набір, не обов'язково той самий, що
// в типовому складі (склад — типова пропорція, можливі матеріали — що взагалі
// допустиме для цього типу тканини).
export const fabricTypePossibleMaterials = pgTable(
  "fabric_type_possible_materials",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    fabricTypeId: uuid("fabric_type_id")
      .notNull()
      .references(() => fabricTypes.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.fabricTypeId, table.materialId] }),
    index("fabric_type_possible_materials_tenant_fabric_type_idx").on(table.tenantId, table.fabricTypeId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

export const fabricTypeSeasons = pgTable(
  "fabric_type_seasons",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    fabricTypeId: uuid("fabric_type_id")
      .notNull()
      .references(() => fabricTypes.id, { onDelete: "cascade" }),
    season: fabricSeasonEnum("season").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.fabricTypeId, table.season] }),
    index("fabric_type_seasons_tenant_fabric_type_idx").on(table.tenantId, table.fabricTypeId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

export const fabricTypeCareInstructions = pgTable(
  "fabric_type_care_instructions",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    fabricTypeId: uuid("fabric_type_id")
      .notNull()
      .references(() => fabricTypes.id, { onDelete: "cascade" }),
    careInstructionId: uuid("care_instruction_id")
      .notNull()
      .references(() => careInstructions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.fabricTypeId, table.careInstructionId] }),
    index("fabric_type_care_instructions_tenant_fabric_type_idx").on(table.tenantId, table.fabricTypeId),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
