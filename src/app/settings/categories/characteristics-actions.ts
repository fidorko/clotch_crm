"use server";

import { revalidatePath } from "next/cache";
import { setCategoryPinnedCharacteristics } from "@/server/data/category-characteristics";
import { listCategories } from "@/server/data/categories";
import { getDescendantIds } from "@/lib/categories/tree";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

/**
 * Зберігає повний список закріплених характеристик категорії (порядок =
 * порядок карток правої панелі) і одразу каскадить той самий список у ВСІХ
 * її нащадків — "останнє редагування виграє" (decisions.md), підтверджено
 * людиною напряму. Товари самі нічого не зберігають (читають список зі своєї
 * `category_id`), тож попередження в UI перед викликом цього екшну — єдина
 * точка, де людина бачить масштаб зміни.
 */
export async function updateCategoryPinnedCharacteristicsAction(
  categoryId: string,
  characteristicKeys: string[]
): Promise<void> {
  const tenantId = getDevTenantId();
  const allCategories = await listCategories(tenantId);
  const descendantIds = getDescendantIds(allCategories, categoryId);
  await setCategoryPinnedCharacteristics(tenantId, categoryId, characteristicKeys, descendantIds);
  revalidatePath(`/settings/categories/${categoryId}`);
  for (const id of descendantIds) revalidatePath(`/settings/categories/${id}`);
}
