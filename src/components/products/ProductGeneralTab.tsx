"use client";

import { useState } from "react";
import { ProductInfoPanel } from "@/components/products/ProductInfoPanel";
import { ProductPhotoGallery } from "@/components/products/ProductPhotoGallery";
import { ProductMetaPanel } from "@/components/products/ProductMetaPanel";
import { ProductSkuSection } from "@/components/products/ProductSkuSection";
import { ProductStatsBar } from "@/components/products/ProductStatsBar";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import type { Product } from "@/lib/types/product";

export function ProductGeneralTab({ product, dev }: { product: Product; dev: boolean }) {
  const [pricing, setPricing] = useState(product.pricing);

  function updatePricing<K extends keyof typeof pricing>(field: K, value: (typeof pricing)[K]) {
    setPricing((prev) => ({ ...prev, [field]: value }));
  }

  const retailAmount =
    pricing.retail.mode === "percent"
      ? pricing.purchasePrice * (1 + pricing.retail.percent / 100)
      : pricing.retail.amount;
  const wholesaleAmount =
    pricing.wholesale.mode === "percent"
      ? pricing.purchasePrice * (1 + pricing.wholesale.percent / 100)
      : pricing.wholesale.amount;
  const dropshipAmount =
    pricing.dropship.mode === "percent"
      ? pricing.purchasePrice * (1 + pricing.dropship.percent / 100)
      : pricing.dropship.amount;
  const retailDiscountAmount =
    pricing.retailDiscount.mode === "percent"
      ? retailAmount * (1 - pricing.retailDiscount.percent / 100)
      : pricing.retailDiscount.amount;

  return (
    <>
      <DevBlockLabel name="ProductStatsBar" enabled={dev}>
        <ProductStatsBar stats={product.stats} />
      </DevBlockLabel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.1fr_1fr]">
        <DevBlockLabel name="ProductInfoPanel" enabled={dev}>
          <ProductInfoPanel product={product} pricing={pricing} onPricingChange={updatePricing} />
        </DevBlockLabel>
        <DevBlockLabel name="ProductPhotoGallery" enabled={dev}>
          <ProductPhotoGallery photos={product.photos} />
        </DevBlockLabel>
        <DevBlockLabel name="ProductMetaPanel" enabled={dev}>
          <ProductMetaPanel product={product} />
        </DevBlockLabel>
      </div>

      <DevBlockLabel name="ProductSkuSection" enabled={dev}>
        <ProductSkuSection
          skus={product.skus}
          measurements={product.measurements}
          pricing={{
            purchasePrice: pricing.purchasePrice,
            retail: retailAmount,
            oldPrice: pricing.oldPrice,
            wholesale: wholesaleAmount,
            dropship: dropshipAmount,
            retailDiscount: retailDiscountAmount,
          }}
        />
      </DevBlockLabel>
    </>
  );
}
