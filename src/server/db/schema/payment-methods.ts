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

// "custom" — довільний спосіб, доданий тенантом через "+Додати спосіб оплати"
// (createPaymentMethodAction завжди ставить kind="custom", незалежно від того,
// що прийшло з форми — інші значення виставляє лише db:seed). Решта 4 —
// системні, засіяні один раз (settings-payment.md).
export const paymentMethodKindEnum = pgEnum("payment_method_kind", [
  "bank_transfer",
  "card_online",
  "partial_payment",
  "cash_on_delivery",
  "custom",
]);

// Тенант-конфігурований довідник способів оплати (settings → Оплата).
export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    kind: paymentMethodKindEnum("kind").notNull().default("custom"),
    name: text("name").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payment_methods_tenant_position_idx").on(table.tenantId, table.position),
    unique("payment_methods_tenant_name_key").on(table.tenantId, table.name),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();

// Варіанти суми для "Часткової оплати" (значуще лише коли
// payment_methods.kind="partial_payment") — за прямою вказівкою людини
// (2026-08-06, другий прохід) кілька варіантів суми замість однієї фіксованої,
// щоб обирати потрібний при оформленні замовлення. Repeatable-список, той
// самий патерн, що delivery_method_status_rules — delete-then-insert одним
// запитом при збереженні форми (settings-payment.md).
export const paymentMethodPartialAmounts = pgTable(
  "payment_method_partial_amounts",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    paymentMethodId: uuid("payment_method_id")
      .notNull()
      .references(() => paymentMethods.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payment_method_partial_amounts_tenant_method_idx").on(
      table.tenantId,
      table.paymentMethodId,
      table.position
    ),
    unique("payment_method_partial_amounts_tenant_method_amount_key").on(
      table.tenantId,
      table.paymentMethodId,
      table.amount
    ),
    tenantIsolationPolicy(table.tenantId),
  ]
).enableRLS();
