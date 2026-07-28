"use client";

import { useState } from "react";
import { ProductSkuTable } from "@/components/products/ProductSkuTable";
import { ProductSkuDetailPanel } from "@/components/products/ProductSkuDetailPanel";
import type { ProductSku } from "@/lib/types/product";
import { selectedSku as defaultSelectedSku } from "@/lib/mocks/products";

export function ProductSkuSection({ skus }: { skus: ProductSku[] }) {
  const [selectedSkuId, setSelectedSkuId] = useState<string | undefined>("s3");
  const activeSku = skus.find((s) => s.id === selectedSkuId);

  return (
    <div className="flex flex-col gap-4">
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
      />
    </div>
  );
}
