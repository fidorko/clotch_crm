import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { productCharacteristicValues, productMaterialComposition } from "@/server/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface MaterialCompositionEntry {
  materialId: string;
  percent: number;
}

/**
 * Значення динамічних характеристик товару, згруповані за ключем (у порядку
 * position). Приймає tx готового виклику (getProductById) — та сама причина,
 * що productColorPhotos у products.ts: щоб не плодити вкладену транзакцію.
 */
export async function getProductCharacteristicValues(
  tx: Tx,
  tenantId: string,
  productId: string
): Promise<Record<string, string[]>> {
  const rows = await tx
    .select({
      characteristicKey: productCharacteristicValues.characteristicKey,
      valueId: productCharacteristicValues.valueId,
    })
    .from(productCharacteristicValues)
    .where(
      and(
        eq(productCharacteristicValues.tenantId, tenantId),
        eq(productCharacteristicValues.productId, productId)
      )
    )
    .orderBy(asc(productCharacteristicValues.position));

  const result: Record<string, string[]> = {};
  for (const row of rows) {
    (result[row.characteristicKey] ??= []).push(row.valueId);
  }
  return result;
}

export async function getProductMaterialComposition(
  tx: Tx,
  tenantId: string,
  productId: string
): Promise<MaterialCompositionEntry[]> {
  const rows = await tx
    .select({
      materialId: productMaterialComposition.materialId,
      percent: productMaterialComposition.percent,
    })
    .from(productMaterialComposition)
    .where(
      and(
        eq(productMaterialComposition.tenantId, tenantId),
        eq(productMaterialComposition.productId, productId)
      )
    )
    .orderBy(asc(productMaterialComposition.position));

  return rows.map((row) => ({ materialId: row.materialId, percent: Number(row.percent) }));
}

/**
 * Повна заміна значень усіх динамічних характеристик товару — delete-then-insert,
 * той самий патерн, що syncProductTags (products.ts). Викликається разом із
 * рештою saveProduct, тим самим tx.
 */
export async function syncProductCharacteristics(
  tx: Tx,
  tenantId: string,
  productId: string,
  characteristics: Record<string, string[]>
): Promise<void> {
  await tx
    .delete(productCharacteristicValues)
    .where(
      and(
        eq(productCharacteristicValues.tenantId, tenantId),
        eq(productCharacteristicValues.productId, productId)
      )
    );

  const rows = Object.entries(characteristics).flatMap(([characteristicKey, valueIds]) =>
    valueIds.map((valueId, index) => ({
      tenantId,
      productId,
      characteristicKey,
      valueId,
      position: index,
    }))
  );
  if (rows.length > 0) {
    await tx.insert(productCharacteristicValues).values(rows);
  }
}

export async function syncProductMaterialComposition(
  tx: Tx,
  tenantId: string,
  productId: string,
  composition: MaterialCompositionEntry[]
): Promise<void> {
  await tx
    .delete(productMaterialComposition)
    .where(
      and(
        eq(productMaterialComposition.tenantId, tenantId),
        eq(productMaterialComposition.productId, productId)
      )
    );

  if (composition.length > 0) {
    await tx.insert(productMaterialComposition).values(
      composition.map((entry, index) => ({
        tenantId,
        productId,
        materialId: entry.materialId,
        percent: String(entry.percent),
        position: index,
      }))
    );
  }
}
