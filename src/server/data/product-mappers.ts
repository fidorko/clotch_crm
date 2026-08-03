import type { Product, ProductColorPhotos, ProductPhoto, ProductSku } from "@/lib/types/product";
import type { products, productSkus, productPhotos } from "@/server/db/schema";
import type { SizeMeasurementEntry } from "./product-size-measurements";

type ProductRow = typeof products.$inferSelect;
type ProductSkuRow = typeof productSkus.$inferSelect;
type ProductPhotoRow = typeof productPhotos.$inferSelect;
type TagRow = { id: string; label: string };
type MaterialCompositionRow = { materialId: string; percent: number };

function toAmount(value: string | null): number {
  return value ? Number(value) : 0;
}

function toAmountOrNull(value: string | null): number | null {
  return value === null ? null : Number(value);
}

function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function mapProductRow(
  product: ProductRow,
  skuRows: ProductSkuRow[],
  photoRows: ProductPhotoRow[],
  sizeMeasurements: SizeMeasurementEntry[],
  tagRows: TagRow[],
  colorPhotosByColor: Map<string, ProductPhoto[]> = new Map(),
  characteristics: Record<string, string[]> = {},
  materialComposition: MaterialCompositionRow[] = []
): Product {
  const skus: ProductSku[] = skuRows.map((s) => ({
    id: s.id,
    code: s.code,
    color: s.color,
    colorHex: s.colorHex,
    size: s.size,
    barcode: s.barcode ?? "",
    stock: s.stock,
    cell: s.cell ?? "",
  }));

  const photos: ProductPhoto[] = photoRows.map((p) => ({
    id: p.id,
    url: `/api/uploads/products/${p.id}`,
    alt: p.alt ?? "",
  }));

  const colorPhotos: ProductColorPhotos[] = [...colorPhotosByColor.entries()].map(
    ([color, colorPhotoList]) => ({ color, photos: colorPhotoList })
  );

  const purchasePrice = toAmount(product.purchasePrice);
  const inStockCount = skus.filter((s) => s.stock > 0).length;
  const totalStock = skus.reduce((sum, s) => sum + s.stock, 0);
  const stockSumPurchase = totalStock * purchasePrice;
  const retailAmount = toAmount(product.retailAmount);
  const stockSumRetail = skus.reduce(
    (sum, s) =>
      sum +
      s.stock *
        (product.retailMode === "percent"
          ? purchasePrice * (1 + toAmount(product.retailPercent) / 100)
          : retailAmount),
    0
  );

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    categoryPath: product.categoryPath,
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    status: product.status,
    isDraft: product.isDraft,
    modelCode: product.modelCode,
    season: product.season ?? "",
    info: {
      gender: product.gender ?? "",
      description: product.description ?? "",
    },
    characteristics,
    materialComposition,
    pricing: {
      purchasePrice,
      retail: {
        mode: product.retailMode,
        amount: retailAmount,
        percent: toAmount(product.retailPercent),
      },
      oldPrice: toAmount(product.oldPrice),
      wholesale: {
        mode: product.wholesaleMode,
        amount: toAmount(product.wholesaleAmount),
        percent: toAmount(product.wholesalePercent),
      },
      dropship: {
        mode: product.dropshipMode,
        amount: toAmount(product.dropshipAmount),
        percent: toAmount(product.dropshipPercent),
      },
      retailDiscount: {
        mode: product.retailDiscountMode,
        amount: toAmount(product.retailDiscountAmount),
        percent: toAmount(product.retailDiscountPercent),
      },
    },
    photos,
    colorPhotos,
    sizeMeasurements,
    meta: {
      createdAt: formatDateTime(product.createdAt),
      updatedAt: formatDateTime(product.updatedAt),
      createdBy: product.createdBy ?? "",
      updatedBy: product.updatedBy ?? "",
      internalCode: product.internalCode ?? "",
      supplierCode: product.supplierCode ?? "",
      // null = не задано власне, успадковує ефективне значення категорії
      // (resolveInheritedField, той самий принцип, що для самих категорій).
      packageLengthCm: product.packageLengthCm,
      packageWidthCm: product.packageWidthCm,
      packageHeightCm: product.packageHeightCm,
      packageWeightKg: toAmountOrNull(product.packageWeightKg),
    },
    tags: tagRows,
    skus,
    stats: {
      skuCount: skus.length,
      inStockCount,
      outOfStockCount: skus.length - inStockCount,
      totalStock,
      stockSumPurchase,
      stockSumRetail,
    },
  };
}
