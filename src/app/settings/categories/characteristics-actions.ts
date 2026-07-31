"use server";

import { revalidatePath } from "next/cache";
import { setCategoryPinnedCharacteristics } from "@/server/data/category-characteristics";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

/** Зберігає повний список закріплених характеристик категорії (порядок = порядок карток правої панелі). */
export async function updateCategoryPinnedCharacteristicsAction(
  categoryId: string,
  characteristicKeys: string[]
): Promise<void> {
  const tenantId = getDevTenantId();
  await setCategoryPinnedCharacteristics(tenantId, categoryId, characteristicKeys);
  revalidatePath(`/settings/categories/${categoryId}`);
}
