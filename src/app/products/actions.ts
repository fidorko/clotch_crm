"use server";

import { revalidatePath } from "next/cache";
import { createProduct, deleteProduct, deleteProducts } from "@/server/data/products";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export async function createProductAction(): Promise<string> {
  const tenantId = getDevTenantId();
  const id = await createProduct(tenantId);
  revalidatePath("/products");
  return id;
}

export async function deleteProductAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteProduct(tenantId, id);
  revalidatePath("/products");
}

export async function deleteProductsAction(ids: string[]): Promise<number> {
  const tenantId = getDevTenantId();
  const deletedCount = await deleteProducts(tenantId, ids);
  revalidatePath("/products");
  return deletedCount;
}
