import { and, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { categoryImages } from "@/server/db/schema";
import { validateImageFile } from "@/server/images/validate-image";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Завантаження зображення категорії відбувається одразу при виборі файлу
 * (жива мініатюра ще до збереження форми) — той самий момент, що раніше писав
 * файл на диск. Рядок цієї таблиці незалежний від categories.id (категорія-
 * чернетка /new його ще не має); саме зображення (байти) тепер у БД, не на диску.
 */
export async function saveCategoryImage(tenantId: string, file: File): Promise<{ url: string }> {
  const { data, mimeType } = await validateImageFile(file);
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .insert(categoryImages)
      .values({ tenantId, data, mimeType })
      .returning({ id: categoryImages.id });
    return { url: `/api/uploads/categories/${row.id}` };
  });
}

export async function readCategoryImage(
  tenantId: string,
  id: string
): Promise<{ data: Buffer; mimeType: string } | null> {
  if (!UUID_RE.test(id)) return null;
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select({ data: categoryImages.data, mimeType: categoryImages.mimeType })
      .from(categoryImages)
      .where(and(eq(categoryImages.tenantId, tenantId), eq(categoryImages.id, id)));
    return row ?? null;
  });
}
