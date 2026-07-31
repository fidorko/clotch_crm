import type { CategoryRow } from "@/server/data/categories";
import type { CategoryPinnedCharacteristics } from "@/server/data/category-characteristics";
import { getCategoryPath } from "./tree";

/**
 * Список закріплених характеристик (у порядку) для категорії — від
 * найближчого предка (включно з нею самою), який має ВЛАСНИЙ список
 * (з'являється в pinnedByCategory лише якщо в категорії є хоч один власний
 * рядок у category_characteristics). Якщо на всьому ланцюжку до кореня
 * власного списку нема — порожньо (нова категорія без предків і без власних
 * дій у drag&drop починає з порожньої правої панелі, не з "усе за
 * замовчуванням" — інша семантика, ніж стара версія цієї картки, підходить
 * куратор-інтерфейсу з drag&drop).
 */
export function resolveCategoryPinnedCharacteristics(
  allCategories: CategoryRow[],
  pinnedByCategory: Record<string, CategoryPinnedCharacteristics>,
  categoryId: string
): CategoryPinnedCharacteristics {
  const path = getCategoryPath(allCategories, categoryId);
  for (let i = path.length - 1; i >= 0; i--) {
    const pinned = pinnedByCategory[path[i].id];
    if (pinned !== undefined) return pinned;
  }
  return [];
}
