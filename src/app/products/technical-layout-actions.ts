"use server";

import { revalidatePath } from "next/cache";
import {
  setTechnicalFieldLayout,
  type TechnicalFieldLayoutEntry,
} from "@/server/data/product-technical-layout";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

/** Тенант-рівневий порядок полів вкладки «Технічні дані», не прив'язаний до конкретного товару — revalidatePath("/products") оновлює всі картки. */
export async function updateTechnicalFieldLayoutAction(
  entries: TechnicalFieldLayoutEntry[]
): Promise<void> {
  const tenantId = getDevTenantId();
  await setTechnicalFieldLayout(tenantId, entries);
  revalidatePath("/products");
}
