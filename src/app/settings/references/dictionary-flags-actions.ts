"use server";

import { revalidatePath } from "next/cache";
import { updateDictionaryFlags, type DictionaryFlags } from "@/server/data/reference-dictionary-flags";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

/** Перемикач (CRM/вітрина/фільтри) прямо на плитці довідника, що не є custom_characteristics — «Кольори», «Тип тканини та матеріал». */
export async function updateDictionaryFlagsAction(
  dictionaryKey: string,
  patch: Partial<DictionaryFlags>
): Promise<void> {
  const tenantId = getDevTenantId();
  await updateDictionaryFlags(tenantId, dictionaryKey, patch);
  revalidatePath("/settings");
}
