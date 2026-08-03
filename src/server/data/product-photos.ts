import { and, eq, sql } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { productPhotos } from "@/server/db/schema";
import type { ProductPhoto } from "@/lib/types/product";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * tenantId — обов'язковий типізований параметр (розділ 6 CLAUDE.md).
 * position = наступний вільний номер (max+1) у межах товару — нове фото завжди в кінці.
 * Байти фото — прямо в рядку (data/mimeType), url для UI рахується з id (не зберігається).
 */
export async function addProductPhoto(
  tenantId: string,
  productId: string,
  data: Buffer,
  mimeType: string,
  alt: string
): Promise<ProductPhoto> {
  return withTenant(tenantId, async (tx) => {
    const [{ maxPosition }] = await tx
      .select({ maxPosition: sql<number>`coalesce(max(${productPhotos.position}), -1)` })
      .from(productPhotos)
      .where(and(eq(productPhotos.tenantId, tenantId), eq(productPhotos.productId, productId)));

    const [row] = await tx
      .insert(productPhotos)
      .values({ tenantId, productId, data, mimeType, alt, position: maxPosition + 1 })
      .returning();

    return { id: row.id, url: `/api/uploads/products/${row.id}`, alt: row.alt ?? "" };
  });
}

/**
 * WHERE tenant_id + id разом (правило 7 розділу 6 CLAUDE.md) — чуже фото просто
 * не знайдеться. Байти фото лежать у тому самому рядку — видалення рядка саме
 * по собі прибирає й зображення, окремого очищення на диску більше не потрібно.
 */
export async function deleteProductPhoto(tenantId: string, photoId: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(productPhotos)
      .where(and(eq(productPhotos.tenantId, tenantId), eq(productPhotos.id, photoId)));
  });
}

export async function readProductPhoto(
  tenantId: string,
  id: string
): Promise<{ data: Buffer; mimeType: string } | null> {
  if (!UUID_RE.test(id)) return null;
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select({ data: productPhotos.data, mimeType: productPhotos.mimeType })
      .from(productPhotos)
      .where(and(eq(productPhotos.tenantId, tenantId), eq(productPhotos.id, id)));
    return row ?? null;
  });
}
