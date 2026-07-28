import { ProductHeader } from "@/components/products/ProductHeader";
import { ProductTabs } from "@/components/products/ProductTabs";
import { ProductInfoPanel } from "@/components/products/ProductInfoPanel";
import { ProductPhotoGallery } from "@/components/products/ProductPhotoGallery";
import { ProductMetaPanel } from "@/components/products/ProductMetaPanel";
import { ProductSkuSection } from "@/components/products/ProductSkuSection";
import { ProductStatsBar } from "@/components/products/ProductStatsBar";
import { mockProduct } from "@/lib/mocks/products";

export default function ProductDetailPage() {
  const product = mockProduct;

  return (
    <div className="flex flex-1 flex-col">
      <ProductHeader product={product} />
      <ProductTabs />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.1fr_1fr]">
          <ProductInfoPanel product={product} />
          <ProductPhotoGallery photos={product.photos} />
          <ProductMetaPanel product={product} />
        </div>

        <ProductSkuSection skus={product.skus} />

        <ProductStatsBar stats={product.stats} />
      </div>
    </div>
  );
}
