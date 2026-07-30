"use server";

import { revalidatePath } from "next/cache";
import {
  updateProductCategory as updateProductCategoryInDb,
  updateProductName as updateProductNameInDb,
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
