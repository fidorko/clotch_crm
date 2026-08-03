import { and, count, eq, inArray } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { warehouseBinLocations } from "@/server/db/schema";
import { generateBinCombinations, type BinGeneratorParams } from "@/lib/warehouse/bin-address";
import type { WarehouseBinGenerationPreview } from "@/lib/types/warehouse-bin";

export type WarehouseBinLocationRow = typeof warehouseBinLocations.$inferSelect;

export async function listBinLocations(
  tenantId: string,
  warehouseId: string,
  limit = 500
): Promise<WarehouseBinLocationRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(warehouseBinLocations)
      .where(
        and(
          eq(warehouseBinLocations.tenantId, tenantId),
          eq(warehouseBinLocations.warehouseId, warehouseId)
        )
      )
      .orderBy(warehouseBinLocations.code)
      .limit(limit)
  );
}

/**
 * "Сухий прогін" перед реальною генерацією (WarehouseBinGenerationWizard) —
 * рахує, скільки комірок уже є в складі й скільки з новозапитаних кодів
 * збігаються з наявними (тобто реально створиться лише різниця). Захист від
 * випадкового створення тисяч зайвих комірок помилково введеним числом.
 */
export async function previewBinGeneration(
  tenantId: string,
  warehouseId: string,
  params: BinGeneratorParams
): Promise<WarehouseBinGenerationPreview> {
  return withTenant(tenantId, async (tx) => {
    const combinations = generateBinCombinations(params);
    const codes = combinations.map((c) => c.code);

    const [{ existingTotal }] = await tx
      .select({ existingTotal: count() })
      .from(warehouseBinLocations)
      .where(
        and(
          eq(warehouseBinLocations.tenantId, tenantId),
          eq(warehouseBinLocations.warehouseId, warehouseId)
        )
      );

    let alreadyMatching = 0;
    if (codes.length > 0) {
      // inArray на потенційно тисячах кодів — одним запитом, батчами по 1000
      // (безпечний ліміт параметрів запиту), не в циклі по одному коду.
      const batchSize = 1000;
      for (let i = 0; i < codes.length; i += batchSize) {
        const batch = codes.slice(i, i + batchSize);
        const [{ matched }] = await tx
          .select({ matched: count() })
          .from(warehouseBinLocations)
          .where(
            and(
              eq(warehouseBinLocations.tenantId, tenantId),
              eq(warehouseBinLocations.warehouseId, warehouseId),
              inArray(warehouseBinLocations.code, batch)
            )
          );
        alreadyMatching += matched;
      }
    }

    return {
      totalRequested: combinations.length,
      existingTotal,
      alreadyMatching,
      willCreateNew: combinations.length - alreadyMatching,
    };
  });
}

/**
 * Реальна генерація — вставляє лише нові комбінації (`onConflictDoNothing` за
 * UNIQUE(tenant_id, warehouse_id, code)), наявні комірки не чіпає. Повертає
 * фактичну кількість вставлених рядків.
 */
export async function generateBinLocations(
  tenantId: string,
  warehouseId: string,
  params: BinGeneratorParams,
  options: { generateBarcodes: boolean; generateQr: boolean }
): Promise<number> {
  return withTenant(tenantId, async (tx) => {
    const combinations = generateBinCombinations(params);
    if (combinations.length === 0) return 0;

    let inserted = 0;
    const batchSize = 500;
    for (let i = 0; i < combinations.length; i += batchSize) {
      const batch = combinations.slice(i, i + batchSize);
      const rows = await tx
        .insert(warehouseBinLocations)
        .values(
          batch.map((bin) => ({
            tenantId,
            warehouseId,
            code: bin.code,
            level1Value: bin.level1,
            level2Value: bin.level2,
            level3Value: bin.level3,
            barcode: options.generateBarcodes ? bin.code : null,
            qrPayload: options.generateQr ? bin.code : null,
          }))
        )
        .onConflictDoNothing()
        .returning({ id: warehouseBinLocations.id });
      inserted += rows.length;
    }
    return inserted;
  });
}
