"use client";

import { useState } from "react";
import { ProductSkuTable } from "@/components/products/ProductSkuTable";
import { ProductSkuDetailPanel } from "@/components/products/ProductSkuDetailPanel";
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

export function ProductSkuSection({
  skus,
  measurements,
  pricing,
}: {
  skus: ProductSku[];
  measurements: ProductMeasurement[];
  pricing: SkuPricing;
}) {
  const [selectedSkuId, setSelectedSkuId] = useState<string | undefined>("s3");
  const activeSku = skus.find((s) => s.id === selectedSkuId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
      <ProductSkuTable
        skus={skus}
        selectedSkuId={selectedSkuId}
        onSelect={setSelectedSkuId}
      />
      <ProductSkuDetailPanel
        sku={{
          ...defaultSelectedSku,
          code: activeSku?.code ?? defaultSelectedSku.code,
        }}
        measurements={measurements}
        pricing={pricing}
      />
    </div>
  );
}
