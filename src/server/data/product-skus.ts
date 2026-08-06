import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { productColorPhotos, productSkus, products } from "@/server/db/schema";
import type { ProductSku } from "@/lib/types/product";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function isUniqueViolation(error: unknown): boolean {
  // Drizzle обгортає сиру помилку postgres.js — реальний код лежить у error.cause.code,
  // не в error.code напряму (гочта, задокументована в db.md).
  const cause = error instanceof Error ? (error as { cause?: unknown }).cause : undefined;
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as { code?: unknown }).code === "23505"
  );
}

function mapSkuRow(row: typeof productSkus.$inferSelect): ProductSku {
  return {
    id: row.id,
    code: row.code,
    color: row.color,
    colorHex: row.colorHex,
    size: row.size,
    barcode: row.barcode ?? "",
    stock: row.stock,
    cell: row.cell ?? "",
  };
}

export interface CreateSkuInput {
  productId: string;
  code: string;
  color: string;
  colorHex: string;
  size: string;
}

/** Один новий SKU (клітинка "+" на перетині кольору й розміру в конструкторі матриці). */
export async function createSku(tenantId: string, input: CreateSkuInput): Promise<ProductSku> {
  try {
    return await withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .insert(productSkus)
        .values({
          tenantId,
          productId: input.productId,
          code: input.code,
          color: input.color,
          colorHex: input.colorHex,
          size: input.size,
        })
        .returning();
      return mapSkuRow(row);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(`SKU з кодом «${input.code}» уже існує`);
    }
    throw error;
  }
}

/** Пакетне створення (кнопка «Автогенерація SKU») — один insert для всіх відсутніх комбінацій. */
export async function createSkus(tenantId: string, inputs: CreateSkuInput[]): Promise<ProductSku[]> {
  if (inputs.length === 0) return [];
  try {
    return await withTenant(tenantId, async (tx) => {
      const rows = await tx
        .insert(productSkus)
        .values(
          inputs.map((input) => ({
            tenantId,
            productId: input.productId,
            code: input.code,
            color: input.color,
            colorHex: input.colorHex,
            size: input.size,
          }))
        )
        .returning();
      return rows.map(mapSkuRow);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Серед автогенерованих SKU є код, що вже існує");
    }
    throw error;
  }
}

/** WHERE tenant_id + id разом (правило 7 розділу 6 CLAUDE.md) — чужий SKU просто не знайдеться. */
export async function deleteSku(tenantId: string, skuId: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(productSkus).where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.id, skuId)));
  });
}

/**
 * Штрихкод — жорстка привʼязка до SKU (пряма вказівка людини: прийомка по ШК,
 * скан має однозначно знаходити один SKU). Унікальність у межах тенанта вже
 * забезпечена БД (`product_skus_tenant_barcode_key`, частковий UNIQUE WHERE
 * barcode IS NOT NULL — db.md) — тут лише ловимо порушення й повертаємо
 * дружнє повідомлення (загальний принцип помилок, conventions.md). WHERE
 * tenant_id + id разом (правило 7 розділу 6 CLAUDE.md).
 */
export async function updateSkuBarcode(
  tenantId: string,
  skuId: string,
  barcode: string | null
): Promise<ProductSku> {
  try {
    return await withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(productSkus)
        .set({ barcode, updatedAt: sql`now()` })
        .where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.id, skuId)))
        .returning();
      return mapSkuRow(row);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(`Штрихкод «${barcode}» уже привʼязаний до іншого SKU`);
    }
    throw error;
  }
}

/** Масове видалення (видалення кольору/розміру цілком — усі SKU цього кольору/розміру). */
export async function deleteSkus(tenantId: string, skuIds: string[]): Promise<void> {
  if (skuIds.length === 0) return;
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(productSkus)
      .where(and(eq(productSkus.tenantId, tenantId), inArray(productSkus.id, skuIds)));
  });
}

export interface ProductSkuCatalogItem {
  id: string;
  sku: string;
  barcode: string | null;
  productName: string;
  color: string;
  colorHex: string;
  size: string;
  photoUrl: string | null;
  retailPrice: number;
}

function toAmount(value: string | null): number {
  return value ? Number(value) : 0;
}

// Джерело для пошуку/додавання позиції в надходження (ProductSkuCombobox і
// сканування штрихкоду в ReceivingItemsTable, warehouse-receiving.md) та
// товарів у формі замовлення (orders-new-order-form.md) — клієнтська
// фільтрація/пошук по `barcode`, як і решта Combobox у проєкті (ui-kit.md),
// тому весь каталог тенанта одним запитом. LIMIT — правило
// "На списках завжди LIMIT" (CLAUDE.md розділ 7); для дуже великого
// каталогу знадобиться пошук на сервері замість повного списку.
const CATALOG_LIMIT = 500;

// Фото прив'язане до пари (productId, color) — не до SKU напряму
// (product-color-photos.ts). Перше фото за позицією — мініатюра. Спільний
// хелпер — той самий join потрібен і в listReceivingDocumentItems
// (server/data/receiving-items.ts), не дублювати.
export async function buildPhotoLookup(
  tx: Tx,
  tenantId: string,
  productIds: string[]
): Promise<Map<string, string>> {
  const photoByProductColor = new Map<string, string>();
  if (productIds.length === 0) return photoByProductColor;

  const photoRows = await tx
    .select({
      id: productColorPhotos.id,
      productId: productColorPhotos.productId,
      color: productColorPhotos.color,
      position: productColorPhotos.position,
    })
    .from(productColorPhotos)
    .where(and(eq(productColorPhotos.tenantId, tenantId), inArray(productColorPhotos.productId, productIds)))
    .orderBy(asc(productColorPhotos.position));

  for (const photo of photoRows) {
    const key = `${photo.productId}|${photo.color}`;
    if (!photoByProductColor.has(key)) {
      photoByProductColor.set(key, `/api/uploads/product-colors/${photo.id}`);
    }
  }
  return photoByProductColor;
}

export async function listProductSkusCatalog(tenantId: string): Promise<ProductSkuCatalogItem[]> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: productSkus.id,
        productId: productSkus.productId,
        sku: productSkus.code,
        barcode: productSkus.barcode,
        productName: products.name,
        color: productSkus.color,
        colorHex: productSkus.colorHex,
        size: productSkus.size,
        purchasePrice: products.purchasePrice,
        retailMode: products.retailMode,
        retailAmount: products.retailAmount,
        retailPercent: products.retailPercent,
      })
      .from(productSkus)
      .innerJoin(products, and(eq(products.id, productSkus.productId), eq(products.tenantId, tenantId)))
      .where(eq(productSkus.tenantId, tenantId))
      .orderBy(asc(products.name), asc(productSkus.size))
      .limit(CATALOG_LIMIT);

    const productIds = [...new Set(rows.map((r) => r.productId))];
    const photoByProductColor = await buildPhotoLookup(tx, tenantId, productIds);

    return rows.map((row) => {
      // Той самий розрахунок, що listProducts (server/data/products.ts) —
      // ціна SKU для форми замовлення (orders.md), поки без урахування
      // per-SKU retailPriceOverride (ще ніде не читається, products-characteristics.md).
      const purchasePrice = toAmount(row.purchasePrice);
      const retailPrice =
        row.retailMode === "percent"
          ? purchasePrice * (1 + toAmount(row.retailPercent) / 100)
          : toAmount(row.retailAmount);
      return {
        id: row.id,
        sku: row.sku,
        barcode: row.barcode,
        productName: row.productName,
        color: row.color,
        colorHex: row.colorHex,
        size: row.size,
        photoUrl: photoByProductColor.get(`${row.productId}|${row.color}`) ?? null,
        retailPrice,
      };
    });
  });
}
