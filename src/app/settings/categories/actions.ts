"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory as createCategoryInDb,
  deleteCategory as deleteCategoryInDb,
  listCategories,
  toggleCategoryActive as toggleCategoryActiveInDb,
  updateCategory as updateCategoryInDb,
  type CategoryInput,
  type CategoryRow,
} from "@/server/data/categories";
import { saveCategoryImage } from "@/server/storage/category-images";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { categoryDepth, isDescendantCategory } from "@/lib/categories/tree";

function textOrNull(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

function numberOrNull(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseCategoryInput(formData: FormData): CategoryInput {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    // Загальна помилка користувачу, деталі — в умові (conventions.md)
    throw new Error("Назва категорії обов'язкова");
  }
  const parentIdRaw = String(formData.get("parentId") ?? "");

  return {
    name,
    parentId: parentIdRaw && parentIdRaw !== "root" ? parentIdRaw : null,
    description: textOrNull(formData, "description"),
    imageUrl: textOrNull(formData, "imageUrl"),
    isActive: formData.get("isActive") === "true",
    showInStorefrontSection: formData.get("showInStorefrontSection") === "true",
    showInHeaderMenu: formData.get("showInHeaderMenu") === "true",
    defaultWeightKg: numberOrNull(formData, "defaultWeightKg"),
    defaultLengthCm: numberOrNull(formData, "defaultLengthCm"),
    defaultWidthCm: numberOrNull(formData, "defaultWidthCm"),
    defaultHeightCm: numberOrNull(formData, "defaultHeightCm"),
    seoH1: textOrNull(formData, "seoH1"),
    seoMetaTitle: textOrNull(formData, "seoMetaTitle"),
    seoMetaDescription: textOrNull(formData, "seoMetaDescription"),
  };
}

export async function createCategoryAction(formData: FormData): Promise<CategoryRow> {
  const tenantId = getDevTenantId();
  const input = parseCategoryInput(formData);
  const category = await createCategoryInDb(tenantId, input);
  revalidatePath("/settings");
  return category;
}

export async function updateCategoryAction(id: string, formData: FormData): Promise<void> {
  const tenantId = getDevTenantId();
  const input = parseCategoryInput(formData);

  if (input.parentId) {
    if (input.parentId === id) {
      throw new Error("Категорія не може бути батьківською сама для себе");
    }
    const all = await listCategories(tenantId);
    if (isDescendantCategory(all, id, input.parentId)) {
      throw new Error("Категорія не може стати дочірньою власного нащадка");
    }
  }

  await updateCategoryInDb(tenantId, id, input);
  revalidatePath("/settings");
  revalidatePath(`/settings/categories/${id}`);
}

export async function deleteCategoryAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteCategoryInDb(tenantId, id);
  revalidatePath("/settings");
}

/**
 * Масове видалення: сортує вибрані id "знизу вгору" (найглибші — першими), щоб
 * FK ON DELETE RESTRICT не заважав видалити разом і батьківську, і її дітей,
 * якщо вони вибрані в тому самому наборі. Якщо в батьківської лишився не
 * вибраний нащадок — її видалення все одно коректно відхилиться, і це
 * потрапить у failed, а не завалить весь запит.
 */
export async function deleteCategoriesAction(
  ids: string[]
): Promise<{ deletedCount: number; failed: { name: string; error: string }[] }> {
  const tenantId = getDevTenantId();
  const all = await listCategories(tenantId);
  const ordered = [...ids].sort(
    (a, b) => categoryDepth(all, b) - categoryDepth(all, a)
  );

  let deletedCount = 0;
  const failed: { name: string; error: string }[] = [];
  for (const id of ordered) {
    try {
      await deleteCategoryInDb(tenantId, id);
      deletedCount++;
    } catch (error) {
      const name = all.find((c) => c.id === id)?.name ?? id;
      failed.push({
        name,
        error: error instanceof Error ? error.message : "Не вдалося видалити",
      });
    }
  }

  revalidatePath("/settings");
  return { deletedCount, failed };
}

export async function toggleCategoryActiveAction(id: string, isActive: boolean): Promise<void> {
  const tenantId = getDevTenantId();
  await toggleCategoryActiveInDb(tenantId, id, isActive);
  revalidatePath("/settings");
}

export async function uploadCategoryImageAction(formData: FormData): Promise<string> {
  const tenantId = getDevTenantId();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Файл не передано");
  }
  const { url } = await saveCategoryImage(tenantId, file);
  return url;
}
