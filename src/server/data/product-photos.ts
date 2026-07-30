import { and, eq, sql } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { productPhotos } from "@/server/db/schema";
import type { ProductPhoto } from "@/lib/types/product";

/**
 * tenantId — обов'язковий типізований параметр (розділ 6 CLAUDE.md).
 * position = наступний вільний номер (max+1) у межах товару — нове фото завжди в кінці.
 */
export async function addProductPhoto(
  tenantId: string,
  productId: string,
  url: string,
  alt: string
): Promise<ProductPhoto> {
  return withTenant(tenantId, async (tx) => {
    const [{ maxPosition }] = await tx
      .select({ maxPosition: sql<number>`coalesce(max(${productPhotos.position}), -1)` })
      .from(productPhotos)
      .where(and(eq(productPhotos.tenantId, tenantId), eq(productPhotos.productId, productId)));

    const [row] = await tx
      .insert(productPhotos)
      .values({ tenantId, productId, url, alt, position: maxPosition + 1 })
      .returning();

    return { id: row.id, url: row.url, alt: row.alt ?? "" };
  });
}

/**
 * WHERE tenant_id + id разом (правило 7 розділу 6 CLAUDE.md) — чуже фото просто
 * не знайдеться. Повертає url видаленого рядка (для очищення файлу на диску) —
 * null, якщо рядка не було (вже видалено або чужий tenant).
 */
export async function deleteProductPhoto(tenantId: string, photoId: string): Promise<string | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .delete(productPhotos)
      .where(and(eq(productPhotos.tenantId, tenantId), eq(productPhotos.id, photoId)))
      .returning({ url: productPhotos.url });
    return row?.url ?? null;
  });
}
