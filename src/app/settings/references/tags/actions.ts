"use server";

import { revalidatePath } from "next/cache";
import {
  createTag as createTagInDb,
  deleteTag as deleteTagInDb,
  updateTag as updateTagInDb,
  type TagRow,
} from "@/server/data/tags";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export async function createTagAction(label: string): Promise<TagRow> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Назва тегу обов'язкова");

  const tenantId = getDevTenantId();
  const tag = await createTagInDb(tenantId, trimmed);
  revalidatePath("/settings/references/tags");
  revalidatePath("/settings");
  return tag;
}

export async function updateTagAction(id: string, label: string): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Назва тегу обов'язкова");

  const tenantId = getDevTenantId();
  await updateTagInDb(tenantId, id, trimmed);
  revalidatePath("/settings/references/tags");
  revalidatePath("/settings");
}

export async function deleteTagAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteTagInDb(tenantId, id);
  revalidatePath("/settings/references/tags");
  revalidatePath("/settings");
  revalidatePath("/products");
}
