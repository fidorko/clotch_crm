import { and, asc, eq } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { deliveryMethodEntitySettings, deliveryMethodStatusRules, deliveryMethods } from "@/server/db/schema";

export type DeliveryMethodEntitySettingsRow = typeof deliveryMethodEntitySettings.$inferSelect;
export type DeliveryMethodStatusRuleRow = typeof deliveryMethodStatusRules.$inferSelect;
export type DeliveryMethodPayer = DeliveryMethodEntitySettingsRow["payer"];
export type DeliveryMethodDeclaredValueMode = DeliveryMethodEntitySettingsRow["declaredValueMode"];
export type DeliveryMethodDescriptionContent = DeliveryMethodEntitySettingsRow["descriptionContent"];
export type DeliveryMethodSenderAddressType = DeliveryMethodEntitySettingsRow["senderAddressType"];
export type DeliveryMethodMarkingPrinterType = DeliveryMethodEntitySettingsRow["markingPrinterType"];

export interface DeliveryMethodStatusRuleInput {
  carrierStatus: string;
  orderStatusId: string | null;
}

// Конфігурація способу доставки для КОНКРЕТНОЇ юридичної особи —
// settings-delivery.md, "способи доставки то одні на тенанта, а от
// налаштування різні" (пряма вказівка людини, 2026-08-06, сьомий прохід).
export interface DeliveryMethodEntitySettingsInput {
  apiKey: string | null;
  senderCounterpartyRef: string | null;
  senderCounterparty: string | null;
  senderContactPersonRef: string | null;
  senderContactPerson: string | null;
  senderPhone: string | null;
  senderAddressType: DeliveryMethodSenderAddressType;
  senderCityRef: string | null;
  senderCity: string | null;
  senderWarehouseRef: string | null;
  senderAddressOrWarehouse: string | null;
  senderStreetRef: string | null;
  senderStreet: string | null;
  senderHouseNumber: string | null;
  payer: DeliveryMethodPayer;
  declaredValueMode: DeliveryMethodDeclaredValueMode;
  declaredValueMinimum: string | null;
  syncFrequencyMinutes: number | null;
  orderReturnOnRefusal: boolean;
  useCarrierPackaging: boolean;
  markingPrinterType: DeliveryMethodMarkingPrinterType;
  descriptionContent: DeliveryMethodDescriptionContent;
  descriptionIncludeQuantity: boolean;
  statusRules: DeliveryMethodStatusRuleInput[];
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const DEFAULT_ENTITY_SETTINGS_VALUES = {
  apiKey: null,
  senderCounterpartyRef: null,
  senderCounterparty: null,
  senderContactPersonRef: null,
  senderContactPerson: null,
  senderPhone: null,
  senderAddressType: "warehouse" as const,
  senderCityRef: null,
  senderCity: null,
  senderWarehouseRef: null,
  senderAddressOrWarehouse: null,
  senderStreetRef: null,
  senderStreet: null,
  senderHouseNumber: null,
  payer: "recipient" as const,
  declaredValueMode: "order_amount" as const,
  declaredValueMinimum: "500",
  descriptionContent: "product_names" as const,
  descriptionIncludeQuantity: true,
  syncFrequencyMinutes: 1,
  orderReturnOnRefusal: false,
  useCarrierPackaging: false,
  markingPrinterType: "regular" as const,
};

/** Замінює весь набір правил "статус перевізника → статус замовлення" для конфігурації — delete-then-insert, той самий прийом, що category-characteristics.ts. */
async function replaceStatusRules(
  tx: Tx,
  tenantId: string,
  entitySettingsId: string,
  rules: DeliveryMethodStatusRuleInput[]
): Promise<void> {
  await tx
    .delete(deliveryMethodStatusRules)
    .where(
      and(
        eq(deliveryMethodStatusRules.tenantId, tenantId),
        eq(deliveryMethodStatusRules.entitySettingsId, entitySettingsId)
      )
    );
  const cleanRules = rules.filter((r) => r.carrierStatus.trim().length > 0);
  if (cleanRules.length === 0) return;
  await tx.insert(deliveryMethodStatusRules).values(
    cleanRules.map((rule, index) => ({
      tenantId,
      entitySettingsId,
      carrierStatus: rule.carrierStatus.trim(),
      orderStatusId: rule.orderStatusId,
      position: index,
    }))
  );
}

/** Усі конфігурації (спосіб×ЮО) тенанта одним запитом — групується на клієнті. */
export async function listAllDeliveryMethodEntitySettings(
  tenantId: string
): Promise<DeliveryMethodEntitySettingsRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx.select().from(deliveryMethodEntitySettings).where(eq(deliveryMethodEntitySettings.tenantId, tenantId))
  );
}

/** Усі правила статусів усіх конфігурацій тенанта одним запитом — групується на клієнті за entitySettingsId. */
export async function listAllDeliveryMethodStatusRules(
  tenantId: string
): Promise<DeliveryMethodStatusRuleRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(deliveryMethodStatusRules)
      .where(eq(deliveryMethodStatusRules.tenantId, tenantId))
      .orderBy(asc(deliveryMethodStatusRules.position), asc(deliveryMethodStatusRules.createdAt))
  );
}

/** Insert-or-update конфігурації для пари (спосіб, ЮО) одним запитом, разом з правилами статусів. */
export async function upsertDeliveryMethodEntitySettings(
  tenantId: string,
  deliveryMethodId: string,
  legalEntityId: string,
  input: DeliveryMethodEntitySettingsInput
): Promise<DeliveryMethodEntitySettingsRow> {
  return withTenant(tenantId, async (tx) => {
    const { statusRules, ...values } = input;
    const [row] = await tx
      .insert(deliveryMethodEntitySettings)
      .values({ tenantId, deliveryMethodId, legalEntityId, ...values })
      .onConflictDoUpdate({
        target: [
          deliveryMethodEntitySettings.tenantId,
          deliveryMethodEntitySettings.deliveryMethodId,
          deliveryMethodEntitySettings.legalEntityId,
        ],
        set: { ...values, updatedAt: new Date() },
      })
      .returning();
    await replaceStatusRules(tx, tenantId, row.id, statusRules);
    return row;
  });
}

/**
 * За прямою вказівкою людини (2026-08-06) — новостворений ФОП/ТОВ одразу
 * отримує по порожньому рядку конфігурації на кожен наявний спосіб
 * доставки тенанта (без ключа/відправника — людина заповнює сама).
 * Викликається в тій самій транзакції, що створення юридичної особи
 * (company-legal-entities.ts).
 */
export async function seedDeliveryMethodEntitySettingsForLegalEntity(
  tx: Tx,
  tenantId: string,
  legalEntityId: string
): Promise<void> {
  const methods = await tx
    .select({ id: deliveryMethods.id })
    .from(deliveryMethods)
    .where(eq(deliveryMethods.tenantId, tenantId));
  if (methods.length === 0) return;
  await tx
    .insert(deliveryMethodEntitySettings)
    .values(
      methods.map((method) => ({
        tenantId,
        deliveryMethodId: method.id,
        legalEntityId,
        ...DEFAULT_ENTITY_SETTINGS_VALUES,
      }))
    )
    .onConflictDoNothing();
}
