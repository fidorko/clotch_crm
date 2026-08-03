"use server";

import { revalidatePath } from "next/cache";
import { updateWarehouseBinLevelFormat, updateWarehouseBinLevelName } from "@/server/data/warehouses";
import {
  countRackDescendants,
  countStreetDescendants,
  createCellWithValue,
  createCells,
  createRackWithValue,
  createRacks,
  createStreetWithValue,
  createStreets,
  deleteCell,
  deleteRack,
  deleteStreet,
  listCells,
  listRacks,
  type WarehouseBinCellRow,
  type WarehouseBinRackRow,
  type WarehouseBinStreetRow,
} from "@/server/data/warehouse-bin-locations";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export async function updateBinLevelNameAction(warehouseId: string, level: 1 | 2 | 3, name: string): Promise<void> {
  const tenantId = getDevTenantId();
  await updateWarehouseBinLevelName(tenantId, warehouseId, level, name);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
}

export async function listRacksAction(streetId: string): Promise<WarehouseBinRackRow[]> {
  const tenantId = getDevTenantId();
  return listRacks(tenantId, streetId);
}

export async function listCellsAction(rackId: string): Promise<WarehouseBinCellRow[]> {
  const tenantId = getDevTenantId();
  return listCells(tenantId, rackId);
}

export async function createStreetsAction(
  warehouseId: string,
  format: string,
  count: number
): Promise<WarehouseBinStreetRow[]> {
  const tenantId = getDevTenantId();
  const created = await createStreets(tenantId, warehouseId, format, count);
  await updateWarehouseBinLevelFormat(tenantId, warehouseId, 1, format);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
  return created;
}

export async function createStreetSingleAction(
  warehouseId: string,
  value: string
): Promise<WarehouseBinStreetRow> {
  const tenantId = getDevTenantId();
  const created = await createStreetWithValue(tenantId, warehouseId, value);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
  return created;
}

export async function createRacksAction(
  warehouseId: string,
  streetId: string,
  format: string,
  count: number
): Promise<WarehouseBinRackRow[]> {
  const tenantId = getDevTenantId();
  const created = await createRacks(tenantId, streetId, format, count);
  await updateWarehouseBinLevelFormat(tenantId, warehouseId, 2, format);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
  return created;
}

export async function createRackSingleAction(
  warehouseId: string,
  streetId: string,
  value: string
): Promise<WarehouseBinRackRow> {
  const tenantId = getDevTenantId();
  const created = await createRackWithValue(tenantId, streetId, value);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
  return created;
}

export async function createCellsAction(
  warehouseId: string,
  rackId: string,
  format: string,
  count: number
): Promise<WarehouseBinCellRow[]> {
  const tenantId = getDevTenantId();
  const created = await createCells(tenantId, rackId, format, count);
  await updateWarehouseBinLevelFormat(tenantId, warehouseId, 3, format);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
  return created;
}

export async function createCellSingleAction(
  warehouseId: string,
  rackId: string,
  value: string
): Promise<WarehouseBinCellRow> {
  const tenantId = getDevTenantId();
  const created = await createCellWithValue(tenantId, rackId, value);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
  return created;
}

export async function deleteStreetAction(warehouseId: string, streetId: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteStreet(tenantId, streetId);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
}

export async function deleteRackAction(warehouseId: string, rackId: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteRack(tenantId, rackId);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
}

export async function deleteCellAction(warehouseId: string, cellId: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteCell(tenantId, cellId);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
}

export async function countStreetDescendantsAction(streetId: string): Promise<{ racks: number; cells: number }> {
  const tenantId = getDevTenantId();
  return countStreetDescendants(tenantId, streetId);
}

export async function countRackDescendantsAction(rackId: string): Promise<{ cells: number }> {
  const tenantId = getDevTenantId();
  return countRackDescendants(tenantId, rackId);
}
