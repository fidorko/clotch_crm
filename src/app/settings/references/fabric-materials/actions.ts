"use server";

import { revalidatePath } from "next/cache";
import {
  createCareInstruction as createCareInstructionInDb,
  deleteCareInstruction as deleteCareInstructionInDb,
  updateCareInstruction as updateCareInstructionInDb,
  type CareInstructionInput,
  type CareInstructionRow,
} from "@/server/data/care-instructions";
import {
  createFabricType as createFabricTypeInDb,
  deleteFabricType as deleteFabricTypeInDb,
  updateFabricType as updateFabricTypeInDb,
  type FabricTypeDetail,
  type FabricTypeInput,
} from "@/server/data/fabric-types";
import {
  createMaterial as createMaterialInDb,
  deleteMaterial as deleteMaterialInDb,
  updateMaterial as updateMaterialInDb,
  type MaterialInput,
  type MaterialRow,
} from "@/server/data/materials";
import { saveFabricTypeImage } from "@/server/storage/fabric-type-images";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

function revalidateFabricMaterials() {
  revalidatePath("/settings/references/fabric-materials");
  revalidatePath("/settings");
}

function parseFabricTypeInput(raw: FabricTypeInput): FabricTypeInput {
  const name = raw.name.trim();
  if (!name) throw new Error("Назва типу тканини обов'язкова");
  for (const item of raw.composition) {
    if (item.percent < 0 || item.percent > 100) {
      throw new Error("Відсоток у складі має бути від 0 до 100");
    }
  }
  return { ...raw, name, description: raw.description?.trim() || null };
}

export async function createFabricTypeAction(input: FabricTypeInput): Promise<FabricTypeDetail> {
  const tenantId = getDevTenantId();
  const fabricType = await createFabricTypeInDb(tenantId, parseFabricTypeInput(input));
  revalidateFabricMaterials();
  return fabricType;
}

export async function updateFabricTypeAction(id: string, input: FabricTypeInput): Promise<void> {
  const tenantId = getDevTenantId();
  await updateFabricTypeInDb(tenantId, id, parseFabricTypeInput(input));
  revalidateFabricMaterials();
}

export async function deleteFabricTypeAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteFabricTypeInDb(tenantId, id);
  revalidateFabricMaterials();
}

export async function uploadFabricTypeImageAction(formData: FormData): Promise<string> {
  const tenantId = getDevTenantId();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Файл не передано");
  }
  const { url } = await saveFabricTypeImage(tenantId, file);
  return url;
}

function parseMaterialInput(input: MaterialInput): MaterialInput {
  const name = input.name.trim();
  if (!name) throw new Error("Назва матеріалу обов'язкова");
  return { name, color: input.color };
}

export async function createMaterialAction(input: MaterialInput): Promise<MaterialRow> {
  const tenantId = getDevTenantId();
  const material = await createMaterialInDb(tenantId, parseMaterialInput(input));
  revalidateFabricMaterials();
  return material;
}

export async function updateMaterialAction(id: string, input: MaterialInput): Promise<void> {
  const tenantId = getDevTenantId();
  await updateMaterialInDb(tenantId, id, parseMaterialInput(input));
  revalidateFabricMaterials();
}

export async function deleteMaterialAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteMaterialInDb(tenantId, id);
  revalidateFabricMaterials();
}

function parseCareInstructionInput(input: CareInstructionInput): CareInstructionInput {
  const name = input.name.trim();
  if (!name) throw new Error("Назва інструкції обов'язкова");
  if (!input.icon) throw new Error("Оберіть іконку");
  return { name, icon: input.icon };
}

export async function createCareInstructionAction(input: CareInstructionInput): Promise<CareInstructionRow> {
  const tenantId = getDevTenantId();
  const careInstruction = await createCareInstructionInDb(tenantId, parseCareInstructionInput(input));
  revalidateFabricMaterials();
  return careInstruction;
}

export async function updateCareInstructionAction(id: string, input: CareInstructionInput): Promise<void> {
  const tenantId = getDevTenantId();
  await updateCareInstructionInDb(tenantId, id, parseCareInstructionInput(input));
  revalidateFabricMaterials();
}

export async function deleteCareInstructionAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteCareInstructionInDb(tenantId, id);
  revalidateFabricMaterials();
}
