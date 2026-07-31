"use server";

import { revalidatePath } from "next/cache";
import {
  createCustomCharacteristic as createCustomCharacteristicInDb,
  deleteCustomCharacteristic as deleteCustomCharacteristicInDb,
  updateCustomCharacteristic as updateCustomCharacteristicInDb,
  updateCustomCharacteristicFlags as updateCustomCharacteristicFlagsInDb,
  type CustomCharacteristicFlags,
  type CustomCharacteristicInput,
  type CustomCharacteristicWithValues,
} from "@/server/data/custom-characteristics";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export interface CustomCharacteristicFormInput {
  name: string;
  values: string[];
}

function parseInput(raw: CustomCharacteristicFormInput): CustomCharacteristicInput {
  const name = raw.name.trim();
  if (!name) throw new Error("Назва характеристики обов'язкова");
  return { name, values: raw.values };
}

function revalidateReferences() {
  revalidatePath("/settings");
}

export async function createCustomCharacteristicAction(
  input: CustomCharacteristicFormInput
): Promise<CustomCharacteristicWithValues> {
  const tenantId = getDevTenantId();
  const characteristic = await createCustomCharacteristicInDb(tenantId, parseInput(input));
  revalidateReferences();
  return characteristic;
}

export async function updateCustomCharacteristicAction(
  id: string,
  input: CustomCharacteristicFormInput
): Promise<CustomCharacteristicWithValues> {
  const tenantId = getDevTenantId();
  const characteristic = await updateCustomCharacteristicInDb(tenantId, id, parseInput(input));
  revalidateReferences();
  revalidatePath("/products");
  revalidatePath("/products/[id]", "layout");
  return characteristic;
}

/** Перемикач прямо на плитці (CRM/вітрина/фільтри) — без відкриття попапу. */
export async function updateCustomCharacteristicFlagsAction(
  id: string,
  flags: Partial<CustomCharacteristicFlags>
): Promise<void> {
  const tenantId = getDevTenantId();
  await updateCustomCharacteristicFlagsInDb(tenantId, id, flags);
  revalidateReferences();
}

export async function deleteCustomCharacteristicAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteCustomCharacteristicInDb(tenantId, id);
  revalidateReferences();
  revalidatePath("/products");
  revalidatePath("/products/[id]", "layout");
}
