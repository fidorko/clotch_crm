import { boolean, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { materials } from "./materials";

// Розтяжність — невеликий фіксований набір (на відміну від custom_characteristics),
// значення задає розробник, не людина через попап, той самий підхід, що
// supplier_type/currency_symbol_position. Сезон навмисно НЕ enum тут — прибрано
// з типу тканини за прямою вказівкою (decisions.md).
export const fabricStretchEnum = pgEnum("fabric_stretch", ["low", "medium", "high"]);

// Тип тканини (settings → Довідники → Тип тканини та матеріал → вкладка
// "Типи тканини"). НЕ зберігає % склад і не прив'язує рекомендації по догляду —
// «тип тканини» це назва структури плетіння (Футер, Кулір...), а не рецепт:
// та сама структура в різних партіях/товарах має різний фактичний склад, тож
// точний % і догляд — властивість конкретного товару (майбутня задача), не
// довідника типу тканини (decisions.md). Тут — лише "Можливі матеріали"
// (fabricTypePossibleMaterials, нижче): що типово зустрічається в цій структурі.
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
    frontSide: text("front_side"),
    backSide: text("back_side"),
    tactileFeel: text("tactile_feel"),
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

// "Можливі матеріали" — ширший чекбокс-набір: що взагалі допустиме для цього
// типу тканини (не рецепт, не %). Єдина junction-таблиця, що лишається на
// рівні типу тканини — decisions.md.
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
