import { and, asc, eq } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { deliveryMethods, deliveryMethodStatusRules } from "@/server/db/schema";

export type DeliveryMethodRow = typeof deliveryMethods.$inferSelect;
export type DeliveryMethodStatusRuleRow = typeof deliveryMethodStatusRules.$inferSelect;
export type DeliveryMethodPayer = "sender" | "recipient" | "third_party";
export type DeliveryMethodDeclaredValueMode = "order_amount" | "minimum_amount";
export type DeliveryMethodPackaging = "none" | "carrier_packaging" | "own_packaging";
export type DeliveryMethodDescriptionContent = "order_id" | "product_sku" | "product_names";

export interface DeliveryMethodStatusRuleInput {
  carrierStatus: string;
  orderStatusId: string | null;
}

export interface DeliveryMethodInput {
  name: string;
  requiresApiKey: boolean;
  apiKey: string | null;
  isEnabled: boolean;
  senderCounterpartyRef: string | null;
  senderCounterparty: string | null;
  senderContactPersonRef: string | null;
  senderContactPerson: string | null;
  senderPhone: string | null;
  senderCityRef: string | null;
  senderCity: string | null;
  senderWarehouseRef: string | null;
  senderAddressOrWarehouse: string | null;
  allowedServiceTypes: string[];
  payer: DeliveryMethodPayer;
  declaredValueMode: DeliveryMethodDeclaredValueMode;
  declaredValueMinimum: string | null;
  syncFrequencyMinutes: number | null;
  orderReturnOnRefusal: boolean;
  packaging: DeliveryMethodPackaging;
  packRef: string | null;
  packDescription: string | null;
  labelFormat: string | null;
  waybillFormat: string | null;
  printerName: string | null;
  descriptionContent: DeliveryMethodDescriptionContent;
  descriptionIncludeQuantity: boolean;
  statusRules: DeliveryMethodStatusRuleInput[];
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

/** Ловить UNIQUE(tenant_id, carrier_key)/(tenant_id, name) (код 23505) — дружній текст (conventions.md). */
function friendlyDuplicateError(error: unknown): never {
  if (pgErrorCode(error) === "23505") {
    throw new Error("Спосіб доставки з такою назвою вже існує");
  }
  throw error;
}

// Та сама спрощена транслітерація, що src/server/data/fabric-types.ts — окремий
// невеликий дубль замість спільного хелпера (db.md), генерує carrier_key лише
// для довільних способів доставки, доданих тенантом (стартові 4 мають фіксовані
// ключі "pickup"/"nova_poshta"/"ukrposhta"/"meest_express").
const TRANSLIT_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia",
};

function slugify(name: string): string {
  const transliterated = name
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT_MAP[ch] ?? ch)
    .join("");
  const slug = transliterated.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return slug || "delivery_method";
}

async function generateUniqueCarrierKey(tx: Tx, tenantId: string, name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const existing = await tx
      .select({ id: deliveryMethods.id })
      .from(deliveryMethods)
      .where(and(eq(deliveryMethods.tenantId, tenantId), eq(deliveryMethods.carrierKey, candidate)))
      .limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
}

/** Замінює весь набір правил "статус перевізника → статус замовлення" для методу — delete-then-insert, той самий прийом, що category-characteristics.ts. */
async function replaceStatusRules(
  tx: Tx,
  tenantId: string,
  deliveryMethodId: string,
  rules: DeliveryMethodStatusRuleInput[]
): Promise<void> {
  await tx
    .delete(deliveryMethodStatusRules)
    .where(
      and(
        eq(deliveryMethodStatusRules.tenantId, tenantId),
        eq(deliveryMethodStatusRules.deliveryMethodId, deliveryMethodId)
      )
    );
  const cleanRules = rules.filter((r) => r.carrierStatus.trim().length > 0);
  if (cleanRules.length === 0) return;
  await tx.insert(deliveryMethodStatusRules).values(
    cleanRules.map((rule, index) => ({
      tenantId,
      deliveryMethodId,
      carrierStatus: rule.carrierStatus.trim(),
      orderStatusId: rule.orderStatusId,
      position: index,
    }))
  );
}

export async function listDeliveryMethods(tenantId: string): Promise<DeliveryMethodRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(deliveryMethods)
      .where(eq(deliveryMethods.tenantId, tenantId))
      .orderBy(asc(deliveryMethods.position), asc(deliveryMethods.createdAt))
  );
}

/** Усі правила статусів усіх методів тенанта одним запитом (не по одному) — групується на клієнті за deliveryMethodId. */
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

export async function createDeliveryMethod(
  tenantId: string,
  input: DeliveryMethodInput
): Promise<DeliveryMethodRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const carrierKey = await generateUniqueCarrierKey(tx, tenantId, input.name);
      const [row] = await tx
        .insert(deliveryMethods)
        .values({ tenantId, carrierKey, ...valuesFromInput(input) })
        .returning();
      await replaceStatusRules(tx, tenantId, row.id, input.statusRules);
      return row;
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

export async function updateDeliveryMethod(
  tenantId: string,
  id: string,
  input: DeliveryMethodInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(deliveryMethods)
        .set({ ...valuesFromInput(input), updatedAt: new Date() })
        .where(and(eq(deliveryMethods.tenantId, tenantId), eq(deliveryMethods.id, id)));
      await replaceStatusRules(tx, tenantId, id, input.statusRules);
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

function valuesFromInput(input: DeliveryMethodInput) {
  return {
    name: input.name,
    requiresApiKey: input.requiresApiKey,
    apiKey: input.apiKey,
    isEnabled: input.isEnabled,
    senderCounterpartyRef: input.senderCounterpartyRef,
    senderCounterparty: input.senderCounterparty,
    senderContactPersonRef: input.senderContactPersonRef,
    senderContactPerson: input.senderContactPerson,
    senderPhone: input.senderPhone,
    senderCityRef: input.senderCityRef,
    senderCity: input.senderCity,
    senderWarehouseRef: input.senderWarehouseRef,
    senderAddressOrWarehouse: input.senderAddressOrWarehouse,
    allowedServiceTypes: input.allowedServiceTypes,
    payer: input.payer,
    declaredValueMode: input.declaredValueMode,
    declaredValueMinimum: input.declaredValueMinimum,
    syncFrequencyMinutes: input.syncFrequencyMinutes,
    orderReturnOnRefusal: input.orderReturnOnRefusal,
    packaging: input.packaging,
    packRef: input.packRef,
    packDescription: input.packDescription,
    labelFormat: input.labelFormat,
    waybillFormat: input.waybillFormat,
    printerName: input.printerName,
    descriptionContent: input.descriptionContent,
    descriptionIncludeQuantity: input.descriptionIncludeQuantity,
  };
}

export async function deleteDeliveryMethod(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(deliveryMethods)
      .where(and(eq(deliveryMethods.tenantId, tenantId), eq(deliveryMethods.id, id)));
  });
}
