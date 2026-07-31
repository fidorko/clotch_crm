"use server";

import { revalidatePath } from "next/cache";
import {
  createSizeType as createSizeTypeInDb,
  deleteSizeType as deleteSizeTypeInDb,
  updateSizeType as updateSizeTypeInDb,
  type SizeTypeWithValues,
} from "@/server/data/size-types";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

function parseInput(input: { name: string; values: string[] }) {
  const name = input.name.trim();
  if (!name) throw new Error("Назва типу розміру обов'язкова");
  return { name, values: input.values };
}

export async function createSizeTypeAction(input: { name: string; values: string[] }): Promise<SizeTypeWithValues> {
  const tenantId = getDevTenantId();
  const type = await createSizeTypeInDb(tenantId, parseInput(input));
  revalidatePath("/settings");
  return type;
}

export async function updateSizeTypeAction(id: string, input: { name: string; values: string[] }): Promise<SizeTypeWithValues> {
  const tenantId = getDevTenantId();
  const type = await updateSizeTypeInDb(tenantId, id, parseInput(input));
  revalidatePath("/settings");
  return type;
}

export async function deleteSizeTypeAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteSizeTypeInDb(tenantId, id);
  revalidatePath("/settings");
}
