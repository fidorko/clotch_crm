"use server";

import { revalidatePath } from "next/cache";
import {
  createReferenceItem as createReferenceItemInDb,
  deleteReferenceItem as deleteReferenceItemInDb,
  updateReferenceItem as updateReferenceItemInDb,
  type ReferenceItemRow,
} from "@/server/data/reference-items";
import { isReferenceItemKind, type ReferenceItemKind } from "@/lib/constants/reference-item-kinds";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

function assertKind(kind: string): ReferenceItemKind {
  if (!isReferenceItemKind(kind)) {
    throw new Error("Невідомий тип довідника");
  }
  return kind;
}

export async function createReferenceItemAction(kind: string, name: string): Promise<ReferenceItemRow> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Назва обов'язкова");

  const validKind = assertKind(kind);
  const tenantId = getDevTenantId();
  const item = await createReferenceItemInDb(tenantId, validKind, trimmed);
  revalidatePath(`/settings/references/${kind}`);
  revalidatePath("/settings");
  return item;
}

export async function updateReferenceItemAction(kind: string, id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Назва обов'язкова");

  const tenantId = getDevTenantId();
  await updateReferenceItemInDb(tenantId, id, trimmed);
  revalidatePath(`/settings/references/${kind}`);
  revalidatePath("/settings");
}

export async function deleteReferenceItemAction(kind: string, id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteReferenceItemInDb(tenantId, id);
  revalidatePath(`/settings/references/${kind}`);
  revalidatePath("/settings");
}
