"use server";

import { revalidatePath } from "next/cache";
import {
  setCharacteristicLayout,
  type CharacteristicLayoutEntry,
} from "@/server/data/product-characteristic-layout";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

/** Тенант-рівневий layout (панель+порядок динамічних характеристик), не прив'язаний до конкретного товару — revalidatePath("/products") оновлює всі картки. */
export async function updateCharacteristicLayoutAction(
  entries: CharacteristicLayoutEntry[]
): Promise<void> {
  const tenantId = getDevTenantId();
  await setCharacteristicLayout(tenantId, entries);
  revalidatePath("/products");
}
