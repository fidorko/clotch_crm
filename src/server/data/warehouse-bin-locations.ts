import { and, eq, inArray } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { warehouseBinCells, warehouseBinRacks, warehouseBinStreets } from "@/server/db/schema";
import { composeBinCode, nextSequenceValues } from "@/lib/warehouse/bin-address";
import type { BinPrintSelection } from "@/lib/types/warehouse-bin";

export type WarehouseBinStreetRow = typeof warehouseBinStreets.$inferSelect;
export type WarehouseBinRackRow = typeof warehouseBinRacks.$inferSelect;
export type WarehouseBinCellRow = typeof warehouseBinCells.$inferSelect;

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

function friendlyDuplicateError(error: unknown): never {
  if (pgErrorCode(error) === "23505") throw new Error("Таке значення вже є на цьому рівні");
  throw error;
}

export async function listStreets(tenantId: string, warehouseId: string): Promise<WarehouseBinStreetRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(warehouseBinStreets)
      .where(and(eq(warehouseBinStreets.tenantId, tenantId), eq(warehouseBinStreets.warehouseId, warehouseId)))
      .orderBy(warehouseBinStreets.value)
  );
}

export async function listRacks(tenantId: string, streetId: string): Promise<WarehouseBinRackRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(warehouseBinRacks)
      .where(and(eq(warehouseBinRacks.tenantId, tenantId), eq(warehouseBinRacks.streetId, streetId)))
      .orderBy(warehouseBinRacks.value)
  );
}

export async function listCells(tenantId: string, rackId: string): Promise<WarehouseBinCellRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(warehouseBinCells)
      .where(and(eq(warehouseBinCells.tenantId, tenantId), eq(warehouseBinCells.rackId, rackId)))
      .orderBy(warehouseBinCells.value)
  );
}

export async function createStreets(
  tenantId: string,
  warehouseId: string,
  format: string,
  count: number
): Promise<WarehouseBinStreetRow[]> {
  return withTenant(tenantId, async (tx) => {
    const existing = await tx
      .select({ value: warehouseBinStreets.value })
      .from(warehouseBinStreets)
      .where(and(eq(warehouseBinStreets.tenantId, tenantId), eq(warehouseBinStreets.warehouseId, warehouseId)));

    const values = nextSequenceValues(
      format,
      existing.map((e) => e.value),
      count
    );
    if (values.length === 0) return [];

    return tx
      .insert(warehouseBinStreets)
      .values(values.map((value) => ({ tenantId, warehouseId, value })))
      .returning();
  });
}

/** Одиничне створення (WarehouseBinColumn — довільна назва напряму в рядку), без формату/послідовності. */
export async function createStreetWithValue(
  tenantId: string,
  warehouseId: string,
  value: string
): Promise<WarehouseBinStreetRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [row] = await tx.insert(warehouseBinStreets).values({ tenantId, warehouseId, value }).returning();
      return row;
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

export async function createRacks(
  tenantId: string,
  streetId: string,
  format: string,
  count: number
): Promise<WarehouseBinRackRow[]> {
  return withTenant(tenantId, async (tx) => {
    const [street] = await tx
      .select()
      .from(warehouseBinStreets)
      .where(and(eq(warehouseBinStreets.tenantId, tenantId), eq(warehouseBinStreets.id, streetId)))
      .limit(1);
    if (!street) throw new Error("Вулицю не знайдено");

    const existing = await tx
      .select({ value: warehouseBinRacks.value })
      .from(warehouseBinRacks)
      .where(and(eq(warehouseBinRacks.tenantId, tenantId), eq(warehouseBinRacks.streetId, streetId)));

    const values = nextSequenceValues(
      format,
      existing.map((e) => e.value),
      count
    );
    if (values.length === 0) return [];

    return tx
      .insert(warehouseBinRacks)
      .values(values.map((value) => ({ tenantId, warehouseId: street.warehouseId, streetId, value })))
      .returning();
  });
}

export async function createRackWithValue(
  tenantId: string,
  streetId: string,
  value: string
): Promise<WarehouseBinRackRow> {
  return withTenant(tenantId, async (tx) => {
    const [street] = await tx
      .select()
      .from(warehouseBinStreets)
      .where(and(eq(warehouseBinStreets.tenantId, tenantId), eq(warehouseBinStreets.id, streetId)))
      .limit(1);
    if (!street) throw new Error("Вулицю не знайдено");

    try {
      const [row] = await tx
        .insert(warehouseBinRacks)
        .values({ tenantId, warehouseId: street.warehouseId, streetId, value })
        .returning();
      return row;
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

export async function createCells(
  tenantId: string,
  rackId: string,
  format: string,
  count: number
): Promise<WarehouseBinCellRow[]> {
  return withTenant(tenantId, async (tx) => {
    const [rack] = await tx
      .select()
      .from(warehouseBinRacks)
      .where(and(eq(warehouseBinRacks.tenantId, tenantId), eq(warehouseBinRacks.id, rackId)))
      .limit(1);
    if (!rack) throw new Error("Стелаж не знайдено");

    const [street] = await tx
      .select()
      .from(warehouseBinStreets)
      .where(and(eq(warehouseBinStreets.tenantId, tenantId), eq(warehouseBinStreets.id, rack.streetId)))
      .limit(1);
    if (!street) throw new Error("Вулицю не знайдено");

    const existing = await tx
      .select({ value: warehouseBinCells.value })
      .from(warehouseBinCells)
      .where(and(eq(warehouseBinCells.tenantId, tenantId), eq(warehouseBinCells.rackId, rackId)));

    const values = nextSequenceValues(
      format,
      existing.map((e) => e.value),
      count
    );
    if (values.length === 0) return [];

    return tx
      .insert(warehouseBinCells)
      .values(
        values.map((value) => {
          const code = composeBinCode(street.value, rack.value, value);
          return { tenantId, warehouseId: rack.warehouseId, rackId, value, code, barcode: code };
        })
      )
      .returning();
  });
}

export async function createCellWithValue(
  tenantId: string,
  rackId: string,
  value: string
): Promise<WarehouseBinCellRow> {
  return withTenant(tenantId, async (tx) => {
    const [rack] = await tx
      .select()
      .from(warehouseBinRacks)
      .where(and(eq(warehouseBinRacks.tenantId, tenantId), eq(warehouseBinRacks.id, rackId)))
      .limit(1);
    if (!rack) throw new Error("Стелаж не знайдено");

    const [street] = await tx
      .select()
      .from(warehouseBinStreets)
      .where(and(eq(warehouseBinStreets.tenantId, tenantId), eq(warehouseBinStreets.id, rack.streetId)))
      .limit(1);
    if (!street) throw new Error("Вулицю не знайдено");

    const code = composeBinCode(street.value, rack.value, value);
    try {
      const [row] = await tx
        .insert(warehouseBinCells)
        .values({ tenantId, warehouseId: rack.warehouseId, rackId, value, code, barcode: code })
        .returning();
      return row;
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

export async function deleteStreet(tenantId: string, streetId: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(warehouseBinStreets)
      .where(and(eq(warehouseBinStreets.tenantId, tenantId), eq(warehouseBinStreets.id, streetId)));
  });
}

export async function deleteRack(tenantId: string, rackId: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(warehouseBinRacks).where(and(eq(warehouseBinRacks.tenantId, tenantId), eq(warehouseBinRacks.id, rackId)));
  });
}

export async function deleteCell(tenantId: string, cellId: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(warehouseBinCells).where(and(eq(warehouseBinCells.tenantId, tenantId), eq(warehouseBinCells.id, cellId)));
  });
}

/**
 * Скільки нащадків буде знесено каскадом — показується в підтвердженні
 * видалення (WarehouseBinColumn), сама операція видалення каскад не рахує
 * (це робить Postgres через ON DELETE CASCADE), тут лише прев'ю числа.
 */
export async function countStreetDescendants(
  tenantId: string,
  streetId: string
): Promise<{ racks: number; cells: number }> {
  return withTenant(tenantId, async (tx) => {
    const racks = await tx
      .select({ id: warehouseBinRacks.id })
      .from(warehouseBinRacks)
      .where(and(eq(warehouseBinRacks.tenantId, tenantId), eq(warehouseBinRacks.streetId, streetId)));
    if (racks.length === 0) return { racks: 0, cells: 0 };

    const rackIds = racks.map((r) => r.id);
    const cells = await tx
      .select({ id: warehouseBinCells.id })
      .from(warehouseBinCells)
      .where(and(eq(warehouseBinCells.tenantId, tenantId), inArray(warehouseBinCells.rackId, rackIds)));

    return { racks: racks.length, cells: cells.length };
  });
}

export async function countRackDescendants(tenantId: string, rackId: string): Promise<{ cells: number }> {
  return withTenant(tenantId, async (tx) => {
    const cells = await tx
      .select({ id: warehouseBinCells.id })
      .from(warehouseBinCells)
      .where(and(eq(warehouseBinCells.tenantId, tenantId), eq(warehouseBinCells.rackId, rackId)));
    return { cells: cells.length };
  });
}

/**
 * Комірки для друку етикеток (bin-print route) — cellIds напряму; rackIds/
 * streetIds означають "усі комірки нижче" (пряма вказівка людини). Дедуп за
 * id, сортування за code — той самий порядок, що й списки колонок.
 */
export async function resolveCellsForPrint(
  tenantId: string,
  warehouseId: string,
  selection: BinPrintSelection
): Promise<{ code: string; barcode: string }[]> {
  return withTenant(tenantId, async (tx) => {
    const rackIds = new Set(selection.rackIds);

    if (selection.streetIds.length > 0) {
      const racksUnderStreets = await tx
        .select({ id: warehouseBinRacks.id })
        .from(warehouseBinRacks)
        .where(
          and(eq(warehouseBinRacks.tenantId, tenantId), inArray(warehouseBinRacks.streetId, selection.streetIds))
        );
      for (const r of racksUnderStreets) rackIds.add(r.id);
    }

    const cellIds = new Set(selection.cellIds);
    if (rackIds.size > 0) {
      const cellsUnderRacks = await tx
        .select({ id: warehouseBinCells.id })
        .from(warehouseBinCells)
        .where(and(eq(warehouseBinCells.tenantId, tenantId), inArray(warehouseBinCells.rackId, [...rackIds])));
      for (const c of cellsUnderRacks) cellIds.add(c.id);
    }

    if (cellIds.size === 0) return [];

    const rows = await tx
      .select({ code: warehouseBinCells.code, barcode: warehouseBinCells.barcode })
      .from(warehouseBinCells)
      .where(
        and(
          eq(warehouseBinCells.tenantId, tenantId),
          eq(warehouseBinCells.warehouseId, warehouseId),
          inArray(warehouseBinCells.id, [...cellIds])
        )
      )
      .orderBy(warehouseBinCells.code);

    return rows;
  });
}
