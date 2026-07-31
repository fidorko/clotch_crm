import type { CategoryRow } from "@/server/data/categories";

type InheritableCategoryField =
  | "isActive"
  | "showInStorefrontSection"
  | "showInHeaderMenu"
  | "defaultWeightKg"
  | "defaultLengthCm"
  | "defaultWidthCm"
  | "defaultHeightCm";

/**
 * Значення поля, узяте від найближчого предка (за parentId, починаючи з
 * startCategoryId включно), де воно явно задане (не null) — "успадкування"
 * від батьківської категорії. startCategoryId — зазвичай ОБРАНИЙ у формі
 * parentId (не сама категорія: якщо в самої категорії null, ефективне
 * значення = те саме, що дав би виклик від її батька). visited — захист від
 * циклу на випадок неконсистентних даних (isDescendantCategory вже не дає
 * створити цикл через форму, це лише страховка).
 */
export function resolveInheritedField<K extends InheritableCategoryField>(
  categories: CategoryRow[],
  startCategoryId: string | null,
  field: K
): CategoryRow[K] | null {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const visited = new Set<string>();
  let current = startCategoryId ? byId.get(startCategoryId) : undefined;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const value = current[field];
    if (value !== null) return value;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return null;
}

/** Ефективне значення 3 перемикачів показу для вже збереженої категорії (включно з нею самою) — для списку категорій. */
export function resolveEffectiveIsActive(categories: CategoryRow[], categoryId: string): boolean {
  return resolveInheritedField(categories, categoryId, "isActive") ?? true;
}
