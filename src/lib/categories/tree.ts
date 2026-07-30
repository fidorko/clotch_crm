interface CategoryLike {
  id: string;
  parentId: string | null;
}

export interface CategoryTreeRow<T extends CategoryLike> {
  category: T;
  depth: number;
  hasChildren: boolean;
}

// Спершу батьківська категорія, одразу під нею — другорядні (діти), з відступом.
// expandedIds=null означає "не згортати нічого" (напр. для плаского списку опцій select).
export function buildCategoryTree<T extends CategoryLike>(
  categories: T[],
  expandedIds: Set<string> | null
): CategoryTreeRow<T>[] {
  const rows: CategoryTreeRow<T>[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const category of categories.filter((c) => c.parentId === parentId)) {
      const hasChildren = categories.some((c) => c.parentId === category.id);
      rows.push({ category, depth, hasChildren });
      if (hasChildren && (expandedIds === null || expandedIds.has(category.id))) {
        walk(category.id, depth + 1);
      }
    }
  }
  walk(null, 0);
  return rows;
}

// Захист від циклу: чи є candidateId нащадком ancestorId.
export function isDescendantCategory<T extends CategoryLike>(
  all: T[],
  ancestorId: string,
  candidateId: string
): boolean {
  let current = all.find((c) => c.id === candidateId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = all.find((c) => c.id === current!.parentId);
  }
  return false;
}

// Усі id нащадків (рекурсивно, без самого id) — для каскадного виділення/видалення.
export function getDescendantIds<T extends CategoryLike>(all: T[], id: string): string[] {
  const result: string[] = [];
  function walk(parentId: string) {
    for (const child of all.filter((c) => c.parentId === parentId)) {
      result.push(child.id);
      walk(child.id);
    }
  }
  walk(id);
  return result;
}

// Шлях від кореня до категорії включно (для хлібних крихт і "повної ієрархії" в UI).
export function getCategoryPath<T extends CategoryLike>(all: T[], id: string): T[] {
  const path: T[] = [];
  let current = all.find((c) => c.id === id);
  while (current) {
    path.unshift(current);
    current = current.parentId ? all.find((c) => c.id === current!.parentId) : undefined;
  }
  return path;
}

// Глибина категорії в дереві (0 = коренева) — для видалення "знизу вгору".
export function categoryDepth<T extends CategoryLike>(all: T[], id: string): number {
  let depth = 0;
  let current = all.find((c) => c.id === id);
  while (current?.parentId) {
    depth++;
    current = all.find((c) => c.id === current!.parentId);
  }
  return depth;
}
