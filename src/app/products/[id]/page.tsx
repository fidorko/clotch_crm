import type { Metadata } from "next";
import { ProductHeader } from "@/components/products/ProductHeader";
import { ProductTabs } from "@/components/products/ProductTabs";
import { ProductInfoPanel } from "@/components/products/ProductInfoPanel";
import { ProductPhotoGallery } from "@/components/products/ProductPhotoGallery";
import { ProductMetaPanel } from "@/components/products/ProductMetaPanel";
import { ProductSkuSection } from "@/components/products/ProductSkuSection";
import { ProductStatsBar } from "@/components/products/ProductStatsBar";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { mockProduct } from "@/lib/mocks/products";

export async function generateMetadata(): Promise<Metadata> {
  return { title: mockProduct.name };
}

export default function ProductDetailPage() {
  const product = mockProduct;
  const dev = DEV_BLOCK_LABELS.products;

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="ProductHeader" enabled={dev}>
        <ProductHeader product={product} />
      </DevBlockLabel>
      <DevBlockLabel name="ProductTabs" enabled={dev}>
        <ProductTabs />
      </DevBlockLabel>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.1fr_1fr]">
          <DevBlockLabel name="ProductInfoPanel" enabled={dev}>
            <ProductInfoPanel product={product} />
          </DevBlockLabel>
          <DevBlockLabel name="ProductPhotoGallery" enabled={dev}>
            <ProductPhotoGallery photos={product.photos} />
          </DevBlockLabel>
          <DevBlockLabel name="ProductMetaPanel" enabled={dev}>
            <ProductMetaPanel product={product} />
          </DevBlockLabel>
        </div>

        <DevBlockLabel name="ProductSkuSection" enabled={dev}>
          <ProductSkuSection skus={product.skus} />
        </DevBlockLabel>

        <DevBlockLabel name="ProductStatsBar" enabled={dev}>
          <ProductStatsBar stats={product.stats} />
        </DevBlockLabel>
      </div>
    </div>
  );
}
