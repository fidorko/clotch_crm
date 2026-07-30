"use client";

import { useState } from "react";
import { ProductSkuTable } from "@/components/products/ProductSkuTable";
import { ProductSkuDetailPanel } from "@/components/products/ProductSkuDetailPanel";
import type { ColorOption } from "@/lib/constants/sku-variant-options";
import type { ProductMeasurement, ProductSku } from "@/lib/types/product";
import { selectedSku as defaultSelectedSku } from "@/lib/mocks/products";

export interface SkuPricing {
  purchasePrice: number;
  retail: number;
  oldPrice: number;
  wholesale: number;
  dropship: number;
  retailDiscount: number;
}

export interface SkuColor {
  id: string;
  name: string;
  hex: string;
}

function colorCode(name: string) {
  const letters = name.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄ]/g, "").toUpperCase();
  return letters.slice(0, 3) || "COL";
}

function buildSkuCode(modelCode: string, color: SkuColor, size: string) {
  return `${modelCode.replace(/-/g, "")}-${colorCode(color.name)}-${size}`;
}

export function ProductSkuSection({
  modelCode,
  measurements,
  pricing,
  colorOptions,
}: {
  modelCode: string;
  measurements: ProductMeasurement[];
  pricing: SkuPricing;
  colorOptions: ColorOption[];
}) {
  const [colors, setColors] = useState<SkuColor[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [skus, setSkus] = useState<ProductSku[]>([]);
  const [selectedSkuId, setSelectedSkuId] = useState<string | undefined>(undefined);

  function addColor(color: ColorOption) {
    setColors((prev) => [...prev, { id: `c-${crypto.randomUUID()}`, ...color }]);
  }

  function addSize(size: string) {
    setSizes((prev) => [...prev, size]);
  }

  function addSku(color: SkuColor, size: string) {
    const sku: ProductSku = {
      id: `sku-${crypto.randomUUID()}`,
      code: buildSkuCode(modelCode, color, size),
      color: color.name,
      colorHex: color.hex,
      size,
      barcode: "",
      stock: 0,
      cell: "",
    };
    setSkus((prev) => [...prev, sku]);
    setSelectedSkuId(sku.id);
  }

  function deleteSku(skuId: string) {
    setSkus((prev) => prev.filter((s) => s.id !== skuId));
    setSelectedSkuId((prev) => (prev === skuId ? undefined : prev));
  }

  function deleteColor(colorId: string) {
    const color = colors.find((c) => c.id === colorId);
    if (!color) return;
    setColors((prev) => prev.filter((c) => c.id !== colorId));
    setSkus((prev) => prev.filter((s) => s.color !== color.name));
    setSelectedSkuId((prev) => {
      const removed = skus.find((s) => s.id === prev);
      return removed && removed.color === color.name ? undefined : prev;
    });
  }

  function deleteSize(size: string) {
    setSizes((prev) => prev.filter((s) => s !== size));
    setSkus((prev) => prev.filter((s) => s.size !== size));
    setSelectedSkuId((prev) => {
      const removed = skus.find((s) => s.id === prev);
      return removed && removed.size === size ? undefined : prev;
    });
  }

  function autoGenerate() {
    setSkus((prev) => {
      const existing = new Set(prev.map((s) => `${s.color}__${s.size}`));
      const generated: ProductSku[] = [];
      for (const color of colors) {
        for (const size of sizes) {
          if (existing.has(`${color.name}__${size}`)) continue;
          generated.push({
            id: `sku-${crypto.randomUUID()}`,
            code: buildSkuCode(modelCode, color, size),
            color: color.name,
            colorHex: color.hex,
            size,
            barcode: "",
            stock: 0,
            cell: "",
          });
        }
      }
      return [...prev, ...generated];
    });
  }

  const activeSku = skus.find((s) => s.id === selectedSkuId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
      <ProductSkuTable
        colors={colors}
        colorOptions={colorOptions}
        sizes={sizes}
        skus={skus}
        selectedSkuId={selectedSkuId}
        onSelect={setSelectedSkuId}
        onAddColor={addColor}
        onAddSize={addSize}
        onAddSku={addSku}
        onDeleteSku={deleteSku}
        onDeleteColor={deleteColor}
        onDeleteSize={deleteSize}
        onAutoGenerate={autoGenerate}
      />
      <ProductSkuDetailPanel
        sku={activeSku ? { ...defaultSelectedSku, code: activeSku.code } : undefined}
        measurements={measurements}
        pricing={pricing}
      />
    </div>
  );
}
