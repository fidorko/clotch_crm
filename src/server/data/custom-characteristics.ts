import { and, asc, eq, inArray } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { customCharacteristicValues, customCharacteristics } from "@/server/db/schema";

export type CustomCharacteristicRow = typeof customCharacteristics.$inferSelect;
export type CustomCharacteristicValueRow = typeof customCharacteristicValues.$inferSelect;

export interface CustomCharacteristicWithValues extends CustomCharacteristicRow {
  values: CustomCharacteristicValueRow[];
}

export interface CustomCharacteristicInput {
  name: string;
  values: string[];
}

export interface CustomCharacteristicFlags {
  showInCrm: boolean;
  showOnStorefront: boolean;
  participatesInFilters: boolean;
}

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

function friendlyDuplicateError(error: unknown, message: string): never {
  if (pgErrorCode(error) === "23505") throw new Error(message);
  throw error;
}

function dedupeValues(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

/** Усі характеристики тенанта разом зі значеннями — для плиток «Довідники», один батч (не N+1). */
export async function listCustomCharacteristicsWithValues(
  tenantId: string
): Promise<CustomCharacteristicWithValues[]> {
  return withTenant(tenantId, async (tx) => {
    const characteristicRows = await tx
      .select()
      .from(customCharacteristics)
      .where(eq(customCharacteristics.tenantId, tenantId))
      .orderBy(asc(customCharacteristics.position), asc(customCharacteristics.createdAt));

    const valueRows = await tx
      .select()
      .from(customCharacteristicValues)
      .where(eq(customCharacteristicValues.tenantId, tenantId))
      .orderBy(asc(customCharacteristicValues.position), asc(customCharacteristicValues.createdAt));

    return characteristicRows.map((characteristic) => ({
      ...characteristic,
      values: valueRows.filter((v) => v.characteristicId === characteristic.id),
    }));
  });
}

/** Створює характеристику разом із початковим набором значень одним запитом (попап "Додати довідник"). 3 перемикачі — за замовчуванням, редагуються потім прямо на плитці. */
export async function createCustomCharacteristic(
  tenantId: string,
  input: CustomCharacteristicInput
): Promise<CustomCharacteristicWithValues> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [characteristic] = await tx
        .insert(customCharacteristics)
        .values({ tenantId, name: input.name })
        .returning();

      const uniqueValues = dedupeValues(input.values);
      const valueRows =
        uniqueValues.length === 0
          ? []
          : await tx
              .insert(customCharacteristicValues)
              .values(
                uniqueValues.map((value, index) => ({
                  tenantId,
                  characteristicId: characteristic.id,
                  value,
                  position: index,
                }))
              )
              .returning();

      return { ...characteristic, values: valueRows };
    } catch (error) {
      friendlyDuplicateError(error, "Характеристика з такою назвою вже існує");
    }
  });
}

/**
 * Оновлює назву й переносить набір значень діфом (видаляє лише прибрані,
 * додає лише нові) — НЕ delete-then-insert усього списку. Критично для
 * характеристики "Теги" (system_key="tags"): її значення — ціль FK з
 * product_tags, і переприсвоєння id при кожному збереженні непомітно стирало
 * б прив'язку тегів до товарів навіть при незміненому наборі значень.
 * Перемикачі сюди свідомо не входять — окрема функція нижче, бо редагуються
 * прямо на плитці, без попапу.
 */
export async function updateCustomCharacteristic(
  tenantId: string,
  id: string,
  input: CustomCharacteristicInput
): Promise<CustomCharacteristicWithValues> {
  return withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(customCharacteristics)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(customCharacteristics.tenantId, tenantId), eq(customCharacteristics.id, id)));
    } catch (error) {
      friendlyDuplicateError(error, "Характеристика з такою назвою вже існує");
    }

    const existingValues = await tx
      .select()
      .from(customCharacteristicValues)
      .where(
        and(eq(customCharacteristicValues.tenantId, tenantId), eq(customCharacteristicValues.characteristicId, id))
      );
    const existingByValue = new Map(existingValues.map((v) => [v.value, v]));

    const nextValues = dedupeValues(input.values);
    const nextSet = new Set(nextValues);

    const toRemoveIds = existingValues.filter((v) => !nextSet.has(v.value)).map((v) => v.id);
    if (toRemoveIds.length > 0) {
      await tx.delete(customCharacteristicValues).where(inArray(customCharacteristicValues.id, toRemoveIds));
    }

    const toAdd = nextValues.filter((v) => !existingByValue.has(v));
    if (toAdd.length > 0) {
      try {
        await tx.insert(customCharacteristicValues).values(
          toAdd.map((value, index) => ({
            tenantId,
            characteristicId: id,
            value,
            position: existingValues.length + index,
          }))
        );
      } catch (error) {
        friendlyDuplicateError(error, "Таке значення вже є в цій характеристиці");
      }
    }

    const [characteristic] = await tx
      .select()
      .from(customCharacteristics)
      .where(and(eq(customCharacteristics.tenantId, tenantId), eq(customCharacteristics.id, id)));
    const values = await tx
      .select()
      .from(customCharacteristicValues)
      .where(
        and(eq(customCharacteristicValues.tenantId, tenantId), eq(customCharacteristicValues.characteristicId, id))
      )
      .orderBy(asc(customCharacteristicValues.position), asc(customCharacteristicValues.createdAt));

    return { ...characteristic, values };
  });
}

/** Одна швидка зміна перемикача прямо на плитці — не чіпає назву/значення. */
export async function updateCustomCharacteristicFlags(
  tenantId: string,
  id: string,
  flags: Partial<CustomCharacteristicFlags>
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(customCharacteristics)
      .set({ ...flags, updatedAt: new Date() })
      .where(and(eq(customCharacteristics.tenantId, tenantId), eq(customCharacteristics.id, id)));
  });
}

/** Каскадно видаляє й усі значення (ON DELETE CASCADE) — для system_key="tags" це прибирає теги з усіх товарів разом. */
export async function deleteCustomCharacteristic(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(customCharacteristics)
      .where(and(eq(customCharacteristics.tenantId, tenantId), eq(customCharacteristics.id, id)));
  });
}
