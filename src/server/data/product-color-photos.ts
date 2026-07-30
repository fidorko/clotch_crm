import { and, count, eq, sql } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { productColorPhotos } from "@/server/db/schema";
import type { ProductPhoto } from "@/lib/types/product";

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
      list.push({ id: row.id, url: row.url, alt: "" });
      result.set(row.color, list);
    }
    return result;
  });
}

export async function countColorPhotos(
  tenantId: string,
  productId: string,
  color: string
): Promise<number> {
  return withTenant(tenantId, async (tx) => {
    const [{ value }] = await tx
      .select({ value: count() })
      .from(productColorPhotos)
      .where(
        and(
          eq(productColorPhotos.tenantId, tenantId),
          eq(productColorPhotos.productId, productId),
          eq(productColorPhotos.color, color)
        )
      );
    return value;
  });
}

/**
 * Ліміт (MAX_COLOR_PHOTOS) перевіряється окремо в Server Action до завантаження
 * файлу на диск (щоб не лишати "осиротілий" файл при відмові) — тут лише запис у БД.
 */
export async function addColorPhoto(
  tenantId: string,
  productId: string,
  color: string,
  url: string
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
      .values({ tenantId, productId, color, url, position: maxPosition + 1 })
      .returning();

    return { id: row.id, url: row.url, alt: "" };
  });
}

/** WHERE tenant_id + id разом (правило 7 розділу 6 CLAUDE.md). Повертає url для очищення файлу на диску. */
export async function deleteColorPhoto(tenantId: string, photoId: string): Promise<string | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .delete(productColorPhotos)
      .where(and(eq(productColorPhotos.tenantId, tenantId), eq(productColorPhotos.id, photoId)))
      .returning({ url: productColorPhotos.url });
    return row?.url ?? null;
  });
}

/**
 * Видалення кольору цілком (ProductSkuTable → DeleteColorButton): color — вільний
 * текст, не FK (db.md), тому cascade за FK тут не спрацює — чистимо явно.
 * Повертає url усіх видалених фото для очищення файлів на диску.
 */
export async function deleteColorPhotosByColor(
  tenantId: string,
  productId: string,
  color: string
): Promise<string[]> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .delete(productColorPhotos)
      .where(
        and(
          eq(productColorPhotos.tenantId, tenantId),
          eq(productColorPhotos.productId, productId),
          eq(productColorPhotos.color, color)
        )
      )
      .returning({ url: productColorPhotos.url });
    return rows.map((r) => r.url);
  });
}
