import { and, eq, sql } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import {
  productMeasurements,
  productPhotos,
  products,
  productSkus,
  productTags,
  tags,
} from "@/server/db/schema";
import type { Product } from "@/lib/types/product";
import { mapProductRow } from "./product-mappers";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * tenantId — обов'язковий типізований параметр (правило 6 розділу 6 CLAUDE.md):
 * без нього виклик не скомпілюється. Усередині withTenant() виставляє сесійну
 * змінну app.tenant_id для RLS (другий рубіж) на додачу до явного WHERE tenant_id
 * нижче (перший рубіж — фільтр у самому запиті).
 */
export async function getProductById(
  tenantId: string,
  productId: string
): Promise<Product | null> {
  // id завжди приходить з URL (params) — неваліфний формат не повинен валити
  // запит помилкою каста в Postgres, а має тихо трактуватись як "не знайдено".
  if (!UUID_RE.test(productId)) return null;

  return withTenant(tenantId, async (tx) => {
    const [productRow] = await tx
      .select()
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.id, productId)))
      .limit(1);

    if (!productRow) return null;

    const [skuRows, photoRows, measurementRows, tagRows] = await Promise.all([
      tx
        .select()
        .from(productSkus)
        .where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.productId, productId))),
      tx
        .select()
        .from(productPhotos)
        .where(and(eq(productPhotos.tenantId, tenantId), eq(productPhotos.productId, productId)))
        .orderBy(productPhotos.position),
      tx
        .select()
        .from(productMeasurements)
        .where(
          and(
            eq(productMeasurements.tenantId, tenantId),
            eq(productMeasurements.productId, productId)
          )
        ),
      tx
        .select({ id: tags.id, label: tags.label })
        .from(productTags)
        .innerJoin(tags, eq(productTags.tagId, tags.id))
        .where(and(eq(productTags.tenantId, tenantId), eq(productTags.productId, productId))),
    ]);

    return mapProductRow(productRow, skuRows, photoRows, measurementRows, tagRows);
  });
}

/**
 * WHERE tenant_id + id разом — навіть якщо productId підсунуть чужий (правило 7
 * розділу 6 CLAUDE.md), запит просто не знайде рядок і нічого не оновить.
 */
export async function updateProductName(
  tenantId: string,
  productId: string,
  name: string
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(products)
      .set({ name, updatedAt: sql`now()` })
      .where(and(eq(products.tenantId, tenantId), eq(products.id, productId)));
  });
}

export async function updateProductCategory(
  tenantId: string,
  productId: string,
  categoryId: string
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(products)
      .set({ categoryId, updatedAt: sql`now()` })
      .where(and(eq(products.tenantId, tenantId), eq(products.id, productId)));
  });
}
