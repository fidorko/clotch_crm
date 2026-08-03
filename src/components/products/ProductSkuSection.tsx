"use client";

import { ProductSkuTable } from "@/components/products/ProductSkuTable";
import type { ProductSkuMatrix } from "@/components/products/useProductSkuMatrix";
import type { ColorOption } from "@/lib/constants/sku-variant-options";

/**
 * Лише таблиця-конструктор SKU-матриці (без «Деталі SKU» — той контент тепер
 * окремий SKUDetail, сусідня колонка ProductGeneralTab, не вкладений сюди).
 * Стан (кольори/розміри/SKU) — ззовні, `useProductSkuMatrix`, той самий
 * інстанс ділить і SKUDetail (потрібен спільний `activeSku`), products.md.
 */
export function ProductSkuSection({
  productId,
  colorOptions,
  sizeOptions,
  matrix,
}: {
  productId: string;
  colorOptions: ColorOption[];
  sizeOptions: string[];
  matrix: ProductSkuMatrix;
}) {
  return (
    <div className="flex h-full flex-col gap-2">
      {matrix.error && <p className="text-sm text-destructive">{matrix.error}</p>}
      <ProductSkuTable
        productId={productId}
        colors={matrix.colors}
        colorOptions={colorOptions}
        sizeOptions={sizeOptions}
        sizes={matrix.sizes}
        skus={matrix.skus}
        selectedSkuId={matrix.selectedSkuId}
        onSelect={matrix.setSelectedSkuId}
        onAddColor={matrix.addColor}
        onAddSize={matrix.addSize}
        onAddSku={matrix.addSku}
        onDeleteSku={matrix.deleteSku}
        onDeleteColor={matrix.deleteColor}
        onDeleteSize={matrix.deleteSize}
        onAutoGenerate={matrix.autoGenerate}
        onColorPhotosChange={matrix.updateColorPhotos}
        disabled={matrix.isPending}
      />
    </div>
  );
}
