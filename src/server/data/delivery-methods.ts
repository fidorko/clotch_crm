import { and, asc, eq } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { deliveryMethods } from "@/server/db/schema";

export type DeliveryMethodRow = typeof deliveryMethods.$inferSelect;

// Список способів доставки — спільний на тенанта (2026-08-06, сьомий прохід,
// пряма вказівка людини: "способи доставки то одні на тенанта"). Уся
// конфігурація, специфічна для юридичної особи (ключ, відправник тощо) —
// server/data/delivery-method-entity-settings.ts.
export interface DeliveryMethodInput {
  name: string;
  requiresApiKey: boolean;
  isEnabled: boolean;
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

export async function listDeliveryMethods(tenantId: string): Promise<DeliveryMethodRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(deliveryMethods)
      .where(eq(deliveryMethods.tenantId, tenantId))
      .orderBy(asc(deliveryMethods.position), asc(deliveryMethods.createdAt))
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
        .values({
          tenantId,
          carrierKey,
          name: input.name,
          requiresApiKey: input.requiresApiKey,
          isEnabled: input.isEnabled,
        })
        .returning();
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
        .set({
          name: input.name,
          requiresApiKey: input.requiresApiKey,
          isEnabled: input.isEnabled,
          updatedAt: new Date(),
        })
        .where(and(eq(deliveryMethods.tenantId, tenantId), eq(deliveryMethods.id, id)));
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

/** Каскадно видаляє й усі delivery_method_entity_settings (ON DELETE CASCADE), разом з їхніми status_rules. */
export async function deleteDeliveryMethod(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(deliveryMethods)
      .where(and(eq(deliveryMethods.tenantId, tenantId), eq(deliveryMethods.id, id)));
  });
}
