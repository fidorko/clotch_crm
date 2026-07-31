"use server";

import { revalidatePath } from "next/cache";
import {
  createMeasurementType as createMeasurementTypeInDb,
  deleteMeasurementType as deleteMeasurementTypeInDb,
  updateMeasurementType as updateMeasurementTypeInDb,
  type MeasurementTypeWithValues,
} from "@/server/data/measurement-types";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

function parseInput(input: { name: string; values: string[] }) {
  const name = input.name.trim();
  if (!name) throw new Error("Назва типу заміру обов'язкова");
  return { name, values: input.values };
}

export async function createMeasurementTypeAction(
  input: { name: string; values: string[] }
): Promise<MeasurementTypeWithValues> {
  const tenantId = getDevTenantId();
  const type = await createMeasurementTypeInDb(tenantId, parseInput(input));
  revalidatePath("/settings");
  return type;
}

export async function updateMeasurementTypeAction(
  id: string,
  input: { name: string; values: string[] }
): Promise<MeasurementTypeWithValues> {
  const tenantId = getDevTenantId();
  const type = await updateMeasurementTypeInDb(tenantId, id, parseInput(input));
  revalidatePath("/settings");
  return type;
}

export async function deleteMeasurementTypeAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteMeasurementTypeInDb(tenantId, id);
  revalidatePath("/settings");
}
