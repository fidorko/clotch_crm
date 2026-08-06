import { boolean, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";

export const companyLegalEntityTypeEnum = pgEnum("company_legal_entity_type", ["fop", "tov"]);

// «Мої ФОП та ТОВ» (settings → Загальні) — юридичні особи/ФОП тенанта, за
// зразком-скріном людини: тип, назва, ЄДРПОУ, статус активності. Повні
// банківські/юридичні реквізити (адреса, рахунок, система оподаткування
// тощо) — не запитувались, у цьому проході не моделюються (див. відкритий
// пункт settings-general.md).
export const companyLegalEntities = pgTable(
  "company_legal_entities",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    type: companyLegalEntityTypeEnum("type").notNull().default("fop"),
    name: text("name").notNull(),
    edrpou: text("edrpou").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("company_legal_entities_tenant_position_idx").on(table.tenantId, table.position),
    unique("company_legal_entities_tenant_edrpou_key").on(table.tenantId, table.edrpou),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
