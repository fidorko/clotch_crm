"use server";

import { revalidatePath } from "next/cache";
import { updateWarehouseBinConfig } from "@/server/data/warehouses";
import {
  generateBinLocations,
  previewBinGeneration,
} from "@/server/data/warehouse-bin-locations";
import type { BinGeneratorParams } from "@/lib/warehouse/bin-address";
import type { WarehouseBinConfigInput, WarehouseBinGenerationPreview } from "@/lib/types/warehouse-bin";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export async function updateWarehouseBinConfigAction(
  warehouseId: string,
  input: WarehouseBinConfigInput
): Promise<void> {
  const tenantId = getDevTenantId();
  await updateWarehouseBinConfig(tenantId, warehouseId, input);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
}

export async function previewBinGenerationAction(
  warehouseId: string,
  params: BinGeneratorParams
): Promise<WarehouseBinGenerationPreview> {
  const tenantId = getDevTenantId();
  return previewBinGeneration(tenantId, warehouseId, params);
}

export async function generateBinLocationsAction(
  warehouseId: string,
  params: BinGeneratorParams,
  options: { generateBarcodes: boolean; generateQr: boolean }
): Promise<number> {
  const tenantId = getDevTenantId();
  const insertedCount = await generateBinLocations(tenantId, warehouseId, params, options);
  revalidatePath(`/settings/warehouses/${warehouseId}`);
  return insertedCount;
}
