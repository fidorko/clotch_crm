import { and, asc, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { categoryCharacteristics } from "@/server/db/schema";

/** Ключ закріпленої характеристики, у порядку правої панелі (position). */
export type CategoryPinnedCharacteristics = string[];

/**
 * Закріплені характеристики ВСІХ категорій тенанта одразу (не по одній —
 * потрібно для успадкування по дереву категорій, той самий принцип, що
 * listCustomCharacteristicsWithValues — один батч, не N+1).
 */
export async function listAllCategoryPinnedCharacteristics(
  tenantId: string
): Promise<Record<string, CategoryPinnedCharacteristics>> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select({
        categoryId: categoryCharacteristics.categoryId,
        characteristicKey: categoryCharacteristics.characteristicKey,
      })
      .from(categoryCharacteristics)
      .where(eq(categoryCharacteristics.tenantId, tenantId))
      .orderBy(asc(categoryCharacteristics.position));

    const result: Record<string, CategoryPinnedCharacteristics> = {};
    for (const row of rows) {
      (result[row.categoryId] ??= []).push(row.characteristicKey);
    }
    return result;
  });
}

/**
 * Повний список закріплених характеристик категорії (у порядку) — будь-яка
 * дія в drag&drop (додати/прибрати/переставити) пише його наново цілком,
 * delete-then-insert, той самий патерн, що syncProductTags/updateSupplier:
 * нічого зовні не посилається на конкретний рядок цієї таблиці. Порожній
 * масив теж валідний виклик — означає "нуль закріплених", хоча наразі
 * невідрізнюваний від "категорія ще не редагувала список" (успадкує від
 * батька, доки в неї взагалі нема жодного власного рядка) — прийнятний
 * компроміс, не просили окремого маркера (decisions.md).
 */
export async function setCategoryPinnedCharacteristics(
  tenantId: string,
  categoryId: string,
  characteristicKeys: string[]
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(categoryCharacteristics)
      .where(
        and(
          eq(categoryCharacteristics.tenantId, tenantId),
          eq(categoryCharacteristics.categoryId, categoryId)
        )
      );

    if (characteristicKeys.length > 0) {
      await tx.insert(categoryCharacteristics).values(
        characteristicKeys.map((characteristicKey, index) => ({
          tenantId,
          categoryId,
          characteristicKey,
          position: index,
        }))
      );
    }
  });
}
