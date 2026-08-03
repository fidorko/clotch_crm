import { and, asc, count, eq } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { warehouses } from "@/server/db/schema";
import type { WarehouseFormInput } from "@/lib/types/warehouse";
import type { WarehouseBinConfigInput } from "@/lib/types/warehouse-bin";

export type WarehouseRow = typeof warehouses.$inferSelect;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

export async function listWarehouses(tenantId: string): Promise<WarehouseRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(warehouses)
      .where(eq(warehouses.tenantId, tenantId))
      .orderBy(asc(warehouses.createdAt))
  );
}

export async function getWarehouseById(tenantId: string, id: string): Promise<WarehouseRow | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.tenantId, tenantId), eq(warehouses.id, id)))
      .limit(1);
    return row ?? null;
  });
}

/**
 * WH-0001, WH-0002... — той самий патерн, що generateSupplierCode
 * (server/data/suppliers.ts): рахується від поточної кількості складів
 * тенанта, ретрай при рідкісній гонці на UNIQUE(tenant_id, code).
 */
async function generateWarehouseCode(tx: Tx, tenantId: string): Promise<string> {
  const [row] = await tx
    .select({ total: count() })
    .from(warehouses)
    .where(eq(warehouses.tenantId, tenantId));
  const next = (row?.total ?? 0) + 1;
  return `WH-${String(next).padStart(4, "0")}`;
}

export async function createWarehouse(
  tenantId: string,
  input: WarehouseFormInput
): Promise<WarehouseRow> {
  return withTenant(tenantId, async (tx) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = await generateWarehouseCode(tx, tenantId);
      try {
        const [row] = await tx
          .insert(warehouses)
          .values({
            tenantId,
            name: input.name,
            code,
            type: input.type,
            isActive: input.isActive,
            responsiblePerson: input.responsiblePerson || null,
            responsiblePhone: input.responsiblePhone || null,
            country: input.country || null,
            city: input.city || null,
            address: input.address || null,
            notes: input.notes || null,
            workHours: input.workHours,
            currencyCode: input.currencyCode || null,
            canSell: input.canSell,
            allowNegativeStock: input.allowNegativeStock,
            useBinLocations: input.useBinLocations,
          })
          .returning();
        return row;
      } catch (error) {
        if (pgErrorCode(error) === "23505" && attempt < 4) continue;
        throw error;
      }
    }
    throw new Error("Не вдалося згенерувати код складу");
  });
}

export async function updateWarehouse(
  tenantId: string,
  id: string,
  input: WarehouseFormInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(warehouses)
      .set({
        name: input.name,
        type: input.type,
        isActive: input.isActive,
        responsiblePerson: input.responsiblePerson || null,
        responsiblePhone: input.responsiblePhone || null,
        country: input.country || null,
        city: input.city || null,
        address: input.address || null,
        notes: input.notes || null,
        workHours: input.workHours,
        currencyCode: input.currencyCode || null,
        canSell: input.canSell,
        allowNegativeStock: input.allowNegativeStock,
        useBinLocations: input.useBinLocations,
        updatedAt: new Date(),
      })
      .where(and(eq(warehouses.tenantId, tenantId), eq(warehouses.id, id)));
  });
}

/**
 * Вкладка «Адресне зберігання» — окремий явний "Зберегти" (не автозбереження,
 * conventions.md: свідомий виняток для дій із ширшим наслідком — тут
 * подальша масова генерація комірок), тож своя функція, не через
 * updateWarehouse/WarehouseFormInput.
 */
export async function updateWarehouseBinConfig(
  tenantId: string,
  id: string,
  input: WarehouseBinConfigInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(warehouses)
      .set({
        binLevel1Name: input.level1Name,
        binLevel2Name: input.level2Name,
        binLevel3Name: input.level3Name,
        binLevel1Format: input.level1Format,
        binLevel2Format: input.level2Format,
        binLevel3Format: input.level3Format,
        binSeparator: input.separator,
        binGenerateBarcodes: input.generateBarcodes,
        binGenerateQr: input.generateQr,
        binAllowLabelReprint: input.allowLabelReprint,
        binStreetsCount: input.streetsCount,
        binRacksPerStreet: input.racksPerStreet,
        binCellsPerRack: input.cellsPerRack,
        updatedAt: new Date(),
      })
      .where(and(eq(warehouses.tenantId, tenantId), eq(warehouses.id, id)));
  });
}

export async function deleteWarehouse(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(warehouses).where(and(eq(warehouses.tenantId, tenantId), eq(warehouses.id, id)));
  });
}
