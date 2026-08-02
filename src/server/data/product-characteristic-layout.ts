import { asc, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { productCharacteristicLayout } from "@/server/db/schema";

export type CharacteristicPanel = "info" | "meta";

export interface CharacteristicLayoutEntry {
  characteristicKey: string;
  panel: CharacteristicPanel;
  position: number;
}

/**
 * Тенант-рівневий розподіл динамічних характеристик по панелях картки товару
 * (ProductInfoPanel/ProductPhotoGallery) + порядок у межах панелі. Не прив'язано
 * до товару — режим "редагувати layout" міняє це для всього тенанта одразу.
 */
export async function getCharacteristicLayout(tenantId: string): Promise<CharacteristicLayoutEntry[]> {
  return withTenant(tenantId, async (tx) => {
    return tx
      .select({
        characteristicKey: productCharacteristicLayout.characteristicKey,
        panel: productCharacteristicLayout.panel,
        position: productCharacteristicLayout.position,
      })
      .from(productCharacteristicLayout)
      .where(eq(productCharacteristicLayout.tenantId, tenantId))
      .orderBy(asc(productCharacteristicLayout.position));
  });
}

/**
 * Повна заміна layout — delete-then-insert, той самий патерн, що
 * setCategoryPinnedCharacteristics. position — індекс у межах СВОЄЇ панелі
 * (рахує клієнт при перетягуванні), не наскрізний.
 */
export async function setCharacteristicLayout(
  tenantId: string,
  entries: CharacteristicLayoutEntry[]
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(productCharacteristicLayout)
      .where(eq(productCharacteristicLayout.tenantId, tenantId));

    if (entries.length === 0) return;
    await tx.insert(productCharacteristicLayout).values(
      entries.map((entry) => ({
        tenantId,
        characteristicKey: entry.characteristicKey,
        panel: entry.panel,
        position: entry.position,
      }))
    );
  });
}
