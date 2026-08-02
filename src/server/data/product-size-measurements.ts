import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { productSizeMeasurements } from "@/server/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface SizeMeasurementEntry {
  size: string;
  measurementValueId: string;
  valueCm: number;
}

/** Значення сітки "розмір × точка заміру" товару — читання (getProductById, той самий tx). */
export async function getProductSizeMeasurements(
  tx: Tx,
  tenantId: string,
  productId: string
): Promise<SizeMeasurementEntry[]> {
  const rows = await tx
    .select({
      size: productSizeMeasurements.size,
      measurementValueId: productSizeMeasurements.measurementValueId,
      valueCm: productSizeMeasurements.valueCm,
    })
    .from(productSizeMeasurements)
    .where(
      and(
        eq(productSizeMeasurements.tenantId, tenantId),
        eq(productSizeMeasurements.productId, productId)
      )
    );

  return rows.map((row) => ({
    size: row.size,
    measurementValueId: row.measurementValueId,
    valueCm: Number(row.valueCm),
  }));
}

/** Повна заміна сітки — delete-then-insert, той самий патерн, що syncProductCharacteristics. */
export async function syncProductSizeMeasurements(
  tx: Tx,
  tenantId: string,
  productId: string,
  entries: SizeMeasurementEntry[]
): Promise<void> {
  await tx
    .delete(productSizeMeasurements)
    .where(
      and(
        eq(productSizeMeasurements.tenantId, tenantId),
        eq(productSizeMeasurements.productId, productId)
      )
    );

  if (entries.length > 0) {
    await tx.insert(productSizeMeasurements).values(
      entries.map((entry) => ({
        tenantId,
        productId,
        size: entry.size,
        measurementValueId: entry.measurementValueId,
        valueCm: String(entry.valueCm),
      }))
    );
  }
}
