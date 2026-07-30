import type {
  Product,
  ProductColorPhotos,
  ProductMeasurement,
  ProductPhoto,
  ProductSku,
} from "@/lib/types/product";
import type {
  products,
  productSkus,
  productPhotos,
  productMeasurements,
} from "@/server/db/schema";

type ProductRow = typeof products.$inferSelect;
type ProductSkuRow = typeof productSkus.$inferSelect;
type ProductPhotoRow = typeof productPhotos.$inferSelect;
type ProductMeasurementRow = typeof productMeasurements.$inferSelect;
type TagRow = { id: string; label: string };

function toAmount(value: string | null): number {
  return value ? Number(value) : 0;
}

function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function mapProductRow(
  product: ProductRow,
  skuRows: ProductSkuRow[],
  photoRows: ProductPhotoRow[],
  measurementRows: ProductMeasurementRow[],
  tagRows: TagRow[],
  colorPhotosByColor: Map<string, ProductPhoto[]> = new Map()
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
    url: p.url,
    alt: p.alt ?? "",
  }));

  const colorPhotos: ProductColorPhotos[] = [...colorPhotosByColor.entries()].map(
    ([color, colorPhotoList]) => ({ color, photos: colorPhotoList })
  );

  const measurements: ProductMeasurement[] = measurementRows.map((m) => ({
    id: m.id,
    type: m.type,
    valueCm: toAmount(m.valueCm),
  }));

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
    status: product.status,
    isDraft: product.isDraft,
    modelCode: product.modelCode,
    brand: product.brand,
    collection: product.collection ?? "",
    season: product.season ?? "",
    info: {
      gender: product.gender ?? "",
      seasonType: product.seasonType ?? "",
      fit: product.fit ?? "",
      countryOfOrigin: product.countryOfOrigin ?? "",
      manufacturer: product.manufacturer ?? "",
      material: product.material ?? "",
      fabricType: product.fabricType ?? "",
      description: product.description ?? "",
    },
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
    measurements,
    meta: {
      createdAt: formatDateTime(product.createdAt),
      updatedAt: formatDateTime(product.updatedAt),
      createdBy: product.createdBy ?? "",
      updatedBy: product.updatedBy ?? "",
      supplier: product.supplier ?? "",
      brandCountry: product.brandCountry ?? "",
      internalCode: product.internalCode ?? "",
      supplierCode: product.supplierCode ?? "",
      packageLengthCm: product.packageLengthCm ?? 0,
      packageWidthCm: product.packageWidthCm ?? 0,
      packageHeightCm: product.packageHeightCm ?? 0,
      packageWeightKg: toAmount(product.packageWeightKg),
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
