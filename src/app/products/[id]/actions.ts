"use server";

import { revalidatePath } from "next/cache";
import {
  saveProduct as saveProductInDb,
  updateProductCategory as updateProductCategoryInDb,
  updateProductName as updateProductNameInDb,
  type SaveProductInput,
} from "@/server/data/products";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export async function updateProductName(productId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    // Загальна помилка користувачу, деталі — тільки в умові (conventions.md)
    throw new Error("Назва товару не може бути порожньою");
  }

  const tenantId = getDevTenantId();
  await updateProductNameInDb(tenantId, productId, trimmed);
  revalidatePath(`/products/${productId}`);
}

export async function updateProductCategory(productId: string, categoryId: string): Promise<void> {
  if (!categoryId) {
    throw new Error("Оберіть категорію");
  }

  const tenantId = getDevTenantId();
  await updateProductCategoryInDb(tenantId, productId, categoryId);
  revalidatePath(`/products/${productId}`);
  revalidatePath("/settings");
}

/** Кнопка «Створити товар»/«Редагувати» в ProductHeader — зберігає всю форму разом. */
export async function saveProductAction(
  productId: string,
  input: SaveProductInput
): Promise<void> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error("Назва товару не може бути порожньою");
  }

  const tenantId = getDevTenantId();
  await saveProductInDb(tenantId, productId, { ...input, name: trimmedName });
  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
}
