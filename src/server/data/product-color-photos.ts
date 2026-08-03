import { and, eq, sql } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { productColorPhotos } from "@/server/db/schema";
import type { ProductPhoto } from "@/lib/types/product";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Групування по кольору — для одного пакетного запиту в getProductById (без N+1). */
export async function listColorPhotosByProductId(
  tenantId: string,
  productId: string
): Promise<Map<string, ProductPhoto[]>> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select()
      .from(productColorPhotos)
      .where(and(eq(productColorPhotos.tenantId, tenantId), eq(productColorPhotos.productId, productId)))
      .orderBy(productColorPhotos.position);

    const result = new Map<string, ProductPhoto[]>();
    for (const row of rows) {
      const list = result.get(row.color) ?? [];
      list.push({ id: row.id, url: `/api/uploads/product-colors/${row.id}`, alt: "", isMain: row.isMain });
      result.set(row.color, list);
    }
    return result;
  });
}

export async function readColorPhoto(
  tenantId: string,
  id: string
): Promise<{ data: Buffer; mimeType: string } | null> {
  if (!UUID_RE.test(id)) return null;
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select({ data: productColorPhotos.data, mimeType: productColorPhotos.mimeType })
      .from(productColorPhotos)
      .where(and(eq(productColorPhotos.tenantId, tenantId), eq(productColorPhotos.id, id)));
    return row ?? null;
  });
}

/**
 * Без ліміту кількості (MAX_COLOR_PHOTOS прибрано, 2026-08-03) — тут лише запис.
 */
export async function addColorPhoto(
  tenantId: string,
  productId: string,
  color: string,
  data: Buffer,
  mimeType: string
): Promise<ProductPhoto> {
  return withTenant(tenantId, async (tx) => {
    const [{ maxPosition }] = await tx
      .select({ maxPosition: sql<number>`coalesce(max(${productColorPhotos.position}), -1)` })
      .from(productColorPhotos)
      .where(
        and(
          eq(productColorPhotos.tenantId, tenantId),
          eq(productColorPhotos.productId, productId),
          eq(productColorPhotos.color, color)
        )
      );

    const [row] = await tx
      .insert(productColorPhotos)
      .values({ tenantId, productId, color, data, mimeType, position: maxPosition + 1 })
      .returning();

    return { id: row.id, url: `/api/uploads/product-colors/${row.id}`, alt: "", isMain: row.isMain };
  });
}

/**
 * Основне фото товару (ProductPhotoGallery, клік на будь-яке наявне фото) —
 * щонайбільше одне на товар. Два послідовні UPDATE в одній транзакції (спершу
 * усі в false, тоді обране в true) — частковий UNIQUE (product_color_photos.
 * is_main) не конфліктує між кроками, бо перевіряється по завершенню кожного
 * стейтменту, а не всієї транзакції.
 */
export async function setMainColorPhoto(
  tenantId: string,
  productId: string,
  photoId: string
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(productColorPhotos)
      .set({ isMain: false })
      .where(and(eq(productColorPhotos.tenantId, tenantId), eq(productColorPhotos.productId, productId)));
    await tx
      .update(productColorPhotos)
      .set({ isMain: true })
      .where(and(eq(productColorPhotos.tenantId, tenantId), eq(productColorPhotos.id, photoId)));
  });
}

/**
 * WHERE tenant_id + id разом (правило 7 розділу 6 CLAUDE.md). Байти лежать у
 * тому самому рядку — видалення рядка саме по собі прибирає й зображення.
 */
export async function deleteColorPhoto(tenantId: string, photoId: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(productColorPhotos)
      .where(and(eq(productColorPhotos.tenantId, tenantId), eq(productColorPhotos.id, photoId)));
  });
}

/**
 * Видалення кольору цілком (ProductSkuTable → DeleteColorButton): color — вільний
 * текст, не FK (db.md), тому cascade за FK тут не спрацює — чистимо явно.
 */
export async function deleteColorPhotosByColor(
  tenantId: string,
  productId: string,
  color: string
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(productColorPhotos)
      .where(
        and(
          eq(productColorPhotos.tenantId, tenantId),
          eq(productColorPhotos.productId, productId),
          eq(productColorPhotos.color, color)
        )
      );
  });
}
