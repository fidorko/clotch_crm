import { asc, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { productTechnicalLayout } from "@/server/db/schema";

export interface TechnicalFieldLayoutEntry {
  fieldKey: string;
  position: number;
}

/**
 * Тенант-рівневий порядок фіксованих полів вкладки «Технічні дані» — не
 * прив'язано до товару, той самий принцип, що product_characteristic_layout.
 */
export async function getTechnicalFieldLayout(tenantId: string): Promise<TechnicalFieldLayoutEntry[]> {
  return withTenant(tenantId, async (tx) => {
    return tx
      .select({
        fieldKey: productTechnicalLayout.fieldKey,
        position: productTechnicalLayout.position,
      })
      .from(productTechnicalLayout)
      .where(eq(productTechnicalLayout.tenantId, tenantId))
      .orderBy(asc(productTechnicalLayout.position));
  });
}

/** Повна заміна порядку — delete-then-insert, той самий патерн, що setCharacteristicLayout. */
export async function setTechnicalFieldLayout(
  tenantId: string,
  entries: TechnicalFieldLayoutEntry[]
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(productTechnicalLayout).where(eq(productTechnicalLayout.tenantId, tenantId));

    if (entries.length === 0) return;
    await tx.insert(productTechnicalLayout).values(
      entries.map((entry) => ({
        tenantId,
        fieldKey: entry.fieldKey,
        position: entry.position,
      }))
    );
  });
}
