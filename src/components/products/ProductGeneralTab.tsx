"use client";

import { useState } from "react";
import { ProductInfoPanel } from "@/components/products/ProductInfoPanel";
import { ProductPhotoGallery } from "@/components/products/ProductPhotoGallery";
import { ProductMetaPanel } from "@/components/products/ProductMetaPanel";
import { ProductSkuSection } from "@/components/products/ProductSkuSection";
import { ProductStatsBar } from "@/components/products/ProductStatsBar";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { Switch } from "@/components/ui/switch";
import type { Product } from "@/lib/types/product";
import type { CategoryRow } from "@/server/data/categories";
import type { ColorOption } from "@/lib/constants/sku-variant-options";
import { useProductEditor } from "@/components/products/ProductEditorContext";

export function ProductGeneralTab({
  product,
  categories,
  colorOptions,
  dev,
}: {
  product: Product;
  categories: CategoryRow[];
  colorOptions: ColorOption[];
  dev: boolean;
}) {
  const { form, setField } = useProductEditor();
  const pricing = form.pricing;
  const [variantsEnabled, setVariantsEnabled] = useState(true);

  function updatePricing<K extends keyof typeof pricing>(field: K, value: (typeof pricing)[K]) {
    setField("pricing", { ...pricing, [field]: value });
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
          <ProductInfoPanel
            product={product}
            categories={categories}
            colorOptions={colorOptions}
            pricing={pricing}
            onPricingChange={updatePricing}
            variantsEnabled={variantsEnabled}
          />
        </DevBlockLabel>
        <DevBlockLabel name="ProductPhotoGallery" enabled={dev}>
          <ProductPhotoGallery photos={product.photos} />
        </DevBlockLabel>
        <DevBlockLabel name="ProductMetaPanel" enabled={dev}>
          <ProductMetaPanel product={product} variantsEnabled={variantsEnabled} />
        </DevBlockLabel>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">Варіації Колір / Розмір</span>
          <span className="text-xs text-muted-foreground">
            Якщо вимкнено — товар веде облік як єдиний SKU, поля якого перенесені на панель метаданих
          </span>
        </div>
        <Switch checked={variantsEnabled} onCheckedChange={setVariantsEnabled} />
      </div>

      {variantsEnabled && (
        <DevBlockLabel name="ProductSkuSection" enabled={dev}>
          <ProductSkuSection
            modelCode={product.modelCode}
            measurements={product.measurements}
            colorOptions={colorOptions}
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
      )}
    </>
  );
}
