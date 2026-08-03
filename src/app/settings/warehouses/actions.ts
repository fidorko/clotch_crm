"use server";

import { revalidatePath } from "next/cache";
import {
  createWarehouse as createWarehouseInDb,
  deleteWarehouse as deleteWarehouseInDb,
  updateWarehouse as updateWarehouseInDb,
  type WarehouseRow,
} from "@/server/data/warehouses";
import type { WarehouseFormInput } from "@/lib/types/warehouse";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export async function createWarehouseAction(input: WarehouseFormInput): Promise<WarehouseRow> {
  const tenantId = getDevTenantId();
  if (!input.name.trim()) {
    throw new Error("Назва складу обов'язкова");
  }
  const warehouse = await createWarehouseInDb(tenantId, input);
  revalidatePath("/settings");
  return warehouse;
}

export async function updateWarehouseAction(id: string, input: WarehouseFormInput): Promise<void> {
  const tenantId = getDevTenantId();
  if (!input.name.trim()) {
    throw new Error("Назва складу обов'язкова");
  }
  await updateWarehouseInDb(tenantId, id, input);
  revalidatePath("/settings");
  revalidatePath(`/settings/warehouses/${id}`);
}

export async function deleteWarehouseAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteWarehouseInDb(tenantId, id);
  revalidatePath("/settings");
}
