import { and, asc, count, eq, isNotNull } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { categories, products } from "@/server/db/schema";

export type CategoryRow = typeof categories.$inferSelect;

export interface CategoryInput {
  name: string;
  parentId: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  showInStorefrontSection: boolean;
  showInHeaderMenu: boolean;
  defaultWeightKg: number | null;
  defaultLengthCm: number | null;
  defaultWidthCm: number | null;
  defaultHeightCm: number | null;
  seoH1: string | null;
  seoMetaTitle: string | null;
  seoMetaDescription: string | null;
}

/** tenantId — обов'язковий типізований параметр (розділ 6 CLAUDE.md), як у server/data/products.ts. */
export async function listCategories(tenantId: string): Promise<CategoryRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenantId))
      .orderBy(asc(categories.position), asc(categories.createdAt))
  );
}

export async function getCategoryById(
  tenantId: string,
  id: string
): Promise<CategoryRow | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select()
      .from(categories)
      .where(and(eq(categories.tenantId, tenantId), eq(categories.id, id)))
      .limit(1);
    return row ?? null;
  });
}

export async function createCategory(
  tenantId: string,
  input: CategoryInput
): Promise<CategoryRow> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .insert(categories)
      .values({
        tenantId,
        name: input.name,
        parentId: input.parentId,
        description: input.description,
        imageUrl: input.imageUrl,
        isActive: input.isActive,
        showInStorefrontSection: input.showInStorefrontSection,
        showInHeaderMenu: input.showInHeaderMenu,
        defaultWeightKg: input.defaultWeightKg !== null ? String(input.defaultWeightKg) : null,
        defaultLengthCm: input.defaultLengthCm,
        defaultWidthCm: input.defaultWidthCm,
        defaultHeightCm: input.defaultHeightCm,
        seoH1: input.seoH1,
        seoMetaTitle: input.seoMetaTitle,
        seoMetaDescription: input.seoMetaDescription,
      })
      .returning();
    return row;
  });
}

export async function updateCategory(
  tenantId: string,
  id: string,
  input: CategoryInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(categories)
      .set({
        name: input.name,
        parentId: input.parentId,
        description: input.description,
        imageUrl: input.imageUrl,
        isActive: input.isActive,
        showInStorefrontSection: input.showInStorefrontSection,
        showInHeaderMenu: input.showInHeaderMenu,
        defaultWeightKg: input.defaultWeightKg !== null ? String(input.defaultWeightKg) : null,
        defaultLengthCm: input.defaultLengthCm,
        defaultWidthCm: input.defaultWidthCm,
        defaultHeightCm: input.defaultHeightCm,
        seoH1: input.seoH1,
        seoMetaTitle: input.seoMetaTitle,
        seoMetaDescription: input.seoMetaDescription,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.tenantId, tenantId), eq(categories.id, id)));
  });
}

/**
 * FK parent_id має ON DELETE RESTRICT — якщо в категорії є діти, Postgres сам
 * відхилить DELETE (foreign_key_violation, код 23503). Ловимо це і повертаємо
 * зрозумілу помилку замість сирого коду Postgres (conventions.md: тексти
 * помилок користувачу — загальні, деталі в лог).
 */
export async function deleteCategory(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .delete(categories)
        .where(and(eq(categories.tenantId, tenantId), eq(categories.id, id)));
    } catch (error) {
      // Drizzle обгортає сиру помилку postgres.js у DrizzleQueryError — реальний
      // код лежить у error.cause.code, не в error.code напряму.
      const pgCode =
        error instanceof Error && error.cause instanceof Error && "code" in error.cause
          ? (error.cause as { code?: string }).code
          : undefined;
      if (pgCode === "23503") {
        throw new Error("Спочатку видаліть або перемістіть дочірні категорії");
      }
      throw error;
    }
  });
}

/**
 * Пряма (без урахування дітей) кількість товарів на кожну category_id.
 * Ієрархічну суму (батьківська = сума дітей) рахує виклик, що має все дерево
 * (CategoriesTab) — тут лише сирі дані per-категорія, Record для серіалізації
 * через RSC-проп (Map серіалізувати не можна).
 */
export async function getProductCountsByCategory(
  tenantId: string
): Promise<Record<string, number>> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select({ categoryId: products.categoryId, total: count() })
      .from(products)
      .where(and(eq(products.tenantId, tenantId), isNotNull(products.categoryId)))
      .groupBy(products.categoryId);

    const result: Record<string, number> = {};
    for (const row of rows) {
      if (row.categoryId) result[row.categoryId] = row.total;
    }
    return result;
  });
}

export async function toggleCategoryActive(
  tenantId: string,
  id: string,
  isActive: boolean
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(categories)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(categories.tenantId, tenantId), eq(categories.id, id)));
  });
}
