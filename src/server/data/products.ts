import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import {
  customCharacteristicValues,
  customCharacteristics,
  productColorPhotos,
  products,
  productSkus,
  productTags,
} from "@/server/db/schema";
import type { Product, ProductStatus } from "@/lib/types/product";
import { DEV_USER } from "@/lib/constants/dev-user";
import { mapProductRow } from "./product-mappers";
import {
  getProductCharacteristicValues,
  getProductMaterialComposition,
  syncProductCharacteristics,
  syncProductMaterialComposition,
  type MaterialCompositionEntry,
} from "./product-characteristics";
import {
  getProductSizeMeasurements,
  syncProductSizeMeasurements,
  type SizeMeasurementEntry,
} from "./product-size-measurements";
import { diffProductFields } from "./product-activity-diff";
import { insertProductActivityLog } from "./product-activity-log";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toAmount(value: string | null): number {
  return value ? Number(value) : 0;
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

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

    const [skuRows, sizeMeasurements, tagRows, characteristics, materialComposition] =
      await Promise.all([
      tx
        .select()
        .from(productSkus)
        .where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.productId, productId))),
      getProductSizeMeasurements(tx, tenantId, productId),
      tx
        .select({ id: customCharacteristicValues.id, label: customCharacteristicValues.value })
        .from(productTags)
        .innerJoin(
          customCharacteristicValues,
          eq(productTags.characteristicValueId, customCharacteristicValues.id)
        )
        .where(and(eq(productTags.tenantId, tenantId), eq(productTags.productId, productId))),
      getProductCharacteristicValues(tx, tenantId, productId),
      getProductMaterialComposition(tx, tenantId, productId),
    ]);

    const colorPhotoRows = await tx
      .select()
      .from(productColorPhotos)
      .where(and(eq(productColorPhotos.tenantId, tenantId), eq(productColorPhotos.productId, productId)))
      .orderBy(productColorPhotos.position);

    const colorPhotosByColor = new Map<string, { id: string; url: string; alt: string; isMain: boolean }[]>();
    for (const row of colorPhotoRows) {
      const list = colorPhotosByColor.get(row.color) ?? [];
      list.push({ id: row.id, url: `/api/uploads/product-colors/${row.id}`, alt: "", isMain: row.isMain });
      colorPhotosByColor.set(row.color, list);
    }

    return mapProductRow(
      productRow,
      skuRows,
      sizeMeasurements,
      tagRows,
      colorPhotosByColor,
      characteristics,
      materialComposition
    );
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

export type ProductStockFilter = "all" | "in_stock" | "out_of_stock";

export interface ListProductsFilters {
  search?: string;
  categoryId?: string | null;
  status?: ProductStatus | "all";
  stock?: ProductStockFilter;
  page: number;
  pageSize: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  modelCode: string;
  status: ProductStatus;
  categoryId: string | null;
  purchasePrice: number;
  retailPrice: number;
  totalStock: number;
  photoUrl: string | null;
  createdAt: string;
}

export interface ProductListResult {
  items: ProductListItem[];
  total: number;
}

/**
 * Список товарів для /products. Залишок фільтрується корельованим підзапитом
 * (не постфактум у JS) — інакше LIMIT/OFFSET і total розійшлись би з видимими
 * рядками. Індекси під WHERE — products_tenant_created_idx (сортування),
 * products_tenant_status_idx, products_tenant_category_idx, і
 * product_skus_tenant_product_idx під підзапит залишку — усі вже є в схемі.
 */
export async function listProducts(
  tenantId: string,
  filters: ListProductsFilters
): Promise<ProductListResult> {
  return withTenant(tenantId, async (tx) => {
    const conditions = [eq(products.tenantId, tenantId)];

    const search = filters.search?.trim();
    if (search) {
      const q = `%${search}%`;
      conditions.push(or(ilike(products.name, q), ilike(products.modelCode, q))!);
    }
    if (filters.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(products.status, filters.status));
    }
    if (filters.stock === "in_stock") {
      conditions.push(
        sql`exists (select 1 from ${productSkus} where ${productSkus.tenantId} = ${tenantId} and ${productSkus.productId} = ${products.id} group by ${productSkus.productId} having sum(${productSkus.stock}) > 0)`
      );
    } else if (filters.stock === "out_of_stock") {
      conditions.push(
        sql`not exists (select 1 from ${productSkus} where ${productSkus.tenantId} = ${tenantId} and ${productSkus.productId} = ${products.id} group by ${productSkus.productId} having sum(${productSkus.stock}) > 0)`
      );
    }
    const where = and(...conditions);

    const [{ total }] = await tx.select({ total: count() }).from(products).where(where);

    const rows = await tx
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    const ids = rows.map((r) => r.id);
    const [stockRows, photoRows] =
      ids.length === 0
        ? [[], []]
        : await Promise.all([
            tx
              .select({ productId: productSkus.productId, stock: productSkus.stock })
              .from(productSkus)
              .where(and(eq(productSkus.tenantId, tenantId), inArray(productSkus.productId, ids))),
            // Мініатюра списку — основне фото товару (is_main), якщо людина
            // його обрала (ProductPhotoGallery); інакше перше фото першого
            // кольору за позицією. Окремої таблиці "фото моделі" більше немає
            // (db.md, 2026-08-03). orderBy isMain DESC ставить основне фото
            // першим рядком на продукт — цикл нижче бере перший рядок на id.
            tx
              .select({
                productId: productColorPhotos.productId,
                id: productColorPhotos.id,
                isMain: productColorPhotos.isMain,
              })
              .from(productColorPhotos)
              .where(
                and(
                  eq(productColorPhotos.tenantId, tenantId),
                  inArray(productColorPhotos.productId, ids)
                )
              )
              .orderBy(desc(productColorPhotos.isMain), asc(productColorPhotos.position)),
          ]);

    const stockByProduct = new Map<string, number>();
    for (const row of stockRows) {
      stockByProduct.set(row.productId, (stockByProduct.get(row.productId) ?? 0) + row.stock);
    }
    const photoByProduct = new Map<string, string>();
    for (const row of photoRows) {
      if (!photoByProduct.has(row.productId)) {
        photoByProduct.set(row.productId, `/api/uploads/product-colors/${row.id}`);
      }
    }

    const items: ProductListItem[] = rows.map((row) => {
      const purchasePrice = toAmount(row.purchasePrice);
      const retailPrice =
        row.retailMode === "percent"
          ? purchasePrice * (1 + toAmount(row.retailPercent) / 100)
          : toAmount(row.retailAmount);
      return {
        id: row.id,
        name: row.name,
        modelCode: row.modelCode,
        status: row.status,
        categoryId: row.categoryId,
        purchasePrice,
        retailPrice,
        totalStock: stockByProduct.get(row.id) ?? 0,
        photoUrl: photoByProduct.get(row.id) ?? null,
        createdAt: formatDate(row.createdAt),
      };
    });

    return { items, total };
  });
}

/** WHERE tenant_id + id разом (правило 7 розділу 6 CLAUDE.md) — чужий товар просто не знайдеться. */
export async function deleteProduct(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(products).where(and(eq(products.tenantId, tenantId), eq(products.id, id)));
  });
}

/**
 * Швидке створення чернетки товару — заповнює лише обов'язкові (NOT NULL) поля
 * плейсхолдерами, решту редагують одразу на сторінці товару (вона це вже вміє).
 * modelCode — унікальний у межах тенанта (UNIQUE(tenant_id, model_code)).
 * internalCode — теж автогенерується (не UNIQUE, тому колізія не критична),
 * редагується вручну одразу на картці товару (олівчик, ProductPhotoGallery).
 */
export async function createProduct(tenantId: string): Promise<string> {
  return withTenant(tenantId, async (tx) => {
    const suffix = Date.now().toString(36).toUpperCase();
    const modelCode = `NEW-${suffix}`;
    const internalCode = `IN-${suffix}`;
    const [row] = await tx
      .insert(products)
      .values({
        tenantId,
        name: "Новий товар",
        category: "",
        categoryPath: "",
        modelCode,
        internalCode,
        isDraft: true,
        createdBy: DEV_USER.name,
      })
      .returning({ id: products.id });

    await insertProductActivityLog(tx, tenantId, row.id, [
      { eventType: "created", actorName: DEV_USER.name, occurredAt: new Date() },
    ]);

    return row.id;
  });
}

export interface SaveProductInput {
  name: string;
  status: ProductStatus;
  categoryId: string | null;
  supplierId: string | null;
  info: {
    gender: string;
    description: string;
  };
  characteristics: Record<string, string[]>;
  materialComposition: MaterialCompositionEntry[];
  sizeMeasurements: SizeMeasurementEntry[];
  pricing: Product["pricing"];
  meta: {
    internalCode: string;
    supplierCode: string;
    packageLengthCm: number | null;
    packageWidthCm: number | null;
    packageHeightCm: number | null;
    packageWeightKg: number | null;
  };
  tags: string[];
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Знаходить характеристику "Теги" тенанта (system_key="tags"), створює за
 * потреби. Раніше теги жили в окремій таблиці tags — тепер це рядок
 * custom_characteristics, як і решта користувацьких довідників (за прямою
 * вказівкою), system_key рятує від залежності на текстову назву (людина може
 * перейменувати відображувану назву характеристики, не зламавши прив'язку).
 */
async function getOrCreateTagsCharacteristicId(tx: Tx, tenantId: string): Promise<string> {
  const [existing] = await tx
    .select({ id: customCharacteristics.id })
    .from(customCharacteristics)
    .where(and(eq(customCharacteristics.tenantId, tenantId), eq(customCharacteristics.systemKey, "tags")));
  if (existing) return existing.id;

  const [created] = await tx
    .insert(customCharacteristics)
    .values({ tenantId, name: "Теги", systemKey: "tags" })
    .returning({ id: customCharacteristics.id });
  return created.id;
}

/** Замінює весь набір тегів товару: знайти-або-створити значення за міткою (tenant-скоуповано), перезаписати product_tags. */
async function syncProductTags(
  tx: Tx,
  tenantId: string,
  productId: string,
  labels: string[]
): Promise<void> {
  await tx
    .delete(productTags)
    .where(and(eq(productTags.tenantId, tenantId), eq(productTags.productId, productId)));

  const uniqueLabels = [...new Set(labels.map((l) => l.trim()).filter(Boolean))];
  if (uniqueLabels.length === 0) return;

  const characteristicId = await getOrCreateTagsCharacteristicId(tx, tenantId);

  const valueIds: string[] = [];
  for (const label of uniqueLabels) {
    const [existing] = await tx
      .select({ id: customCharacteristicValues.id })
      .from(customCharacteristicValues)
      .where(
        and(
          eq(customCharacteristicValues.tenantId, tenantId),
          eq(customCharacteristicValues.characteristicId, characteristicId),
          eq(customCharacteristicValues.value, label)
        )
      );
    const valueId = existing
      ? existing.id
      : (
          await tx
            .insert(customCharacteristicValues)
            .values({ tenantId, characteristicId, value: label })
            .returning({ id: customCharacteristicValues.id })
        )[0].id;
    valueIds.push(valueId);
  }

  await tx
    .insert(productTags)
    .values(valueIds.map((characteristicValueId) => ({ tenantId, productId, characteristicValueId })))
    .onConflictDoNothing();
}

/**
 * Зберігає всю форму картки товару одним запитом (кнопка "Створити товар"/"Редагувати")
 * і знімає прапорець чернетки. WHERE tenant_id + id (правило 7 розділу 6 CLAUDE.md).
 */
export async function saveProduct(
  tenantId: string,
  productId: string,
  input: SaveProductInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    const [before] = await tx
      .select()
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.id, productId)));
    if (!before) return;

    const nextValues = {
      name: input.name,
      status: input.status,
      categoryId: input.categoryId,
      supplierId: input.supplierId,
      gender: input.info.gender,
      description: input.info.description,
      purchasePrice: String(input.pricing.purchasePrice),
      oldPrice: String(input.pricing.oldPrice),
      retailMode: input.pricing.retail.mode,
      retailAmount: String(input.pricing.retail.amount),
      retailPercent: String(input.pricing.retail.percent),
      wholesaleMode: input.pricing.wholesale.mode,
      wholesaleAmount: String(input.pricing.wholesale.amount),
      wholesalePercent: String(input.pricing.wholesale.percent),
      dropshipMode: input.pricing.dropship.mode,
      dropshipAmount: String(input.pricing.dropship.amount),
      dropshipPercent: String(input.pricing.dropship.percent),
      retailDiscountMode: input.pricing.retailDiscount.mode,
      retailDiscountAmount: String(input.pricing.retailDiscount.amount),
      retailDiscountPercent: String(input.pricing.retailDiscount.percent),
      sameSizePricing: input.pricing.sameForAllSizes,
      internalCode: input.meta.internalCode,
      supplierCode: input.meta.supplierCode,
      packageLengthCm: input.meta.packageLengthCm,
      packageWidthCm: input.meta.packageWidthCm,
      packageHeightCm: input.meta.packageHeightCm,
      packageWeightKg:
        input.meta.packageWeightKg === null ? null : String(input.meta.packageWeightKg),
    };

    await tx
      .update(products)
      .set({
        ...nextValues,
        isDraft: false,
        updatedBy: DEV_USER.name,
        updatedAt: sql`now()`,
      })
      .where(and(eq(products.tenantId, tenantId), eq(products.id, productId)));

    // Кожне автозбереження пише ВЕСЬ стан форми одним запитом (не по полях
    // окремо), тому діф проти рядка ДО update — інакше кожен виклик
    // saveProduct писав би в журнал усі ~25 полів, навіть незмінені
    // (modules/products.md, "Технічні дані" → журнал подій).
    const occurredAt = new Date();
    const changes = await diffProductFields(tx, tenantId, before, nextValues);
    if (changes.length > 0) {
      await insertProductActivityLog(
        tx,
        tenantId,
        productId,
        changes.map((change) => ({
          eventType: "updated" as const,
          actorName: DEV_USER.name,
          occurredAt,
          fieldKey: change.key,
          fieldLabel: change.label,
          oldValue: change.oldValue,
          newValue: change.newValue,
        }))
      );
    }

    await syncProductTags(tx, tenantId, productId, input.tags);
    await syncProductCharacteristics(tx, tenantId, productId, input.characteristics);
    await syncProductMaterialComposition(tx, tenantId, productId, input.materialComposition);
    await syncProductSizeMeasurements(tx, tenantId, productId, input.sizeMeasurements);
  });
}

export async function deleteProducts(tenantId: string, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  return withTenant(tenantId, async (tx) => {
    const deleted = await tx
      .delete(products)
      .where(and(eq(products.tenantId, tenantId), inArray(products.id, ids)))
      .returning({ id: products.id });
    return deleted.length;
  });
}
