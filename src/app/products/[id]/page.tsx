import type { Metadata } from "next";
import { ProductHeader } from "@/components/products/ProductHeader";
import { ProductTabs } from "@/components/products/ProductTabs";
import { ProductGeneralTab } from "@/components/products/ProductGeneralTab";
import { ProductSizeChart } from "@/components/products/ProductSizeChart";
import { ProductMeasurements } from "@/components/products/ProductMeasurements";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
      <Tabs defaultValue="general" className="flex flex-1 flex-col">
        <DevBlockLabel name="ProductTabs" enabled={dev}>
          <ProductTabs />
        </DevBlockLabel>

        <TabsContent value="general" className="flex flex-col gap-4 p-6">
          <ProductGeneralTab product={product} dev={dev} />
        </TabsContent>

        <TabsContent value="sizes" className="flex flex-col gap-4 p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
            <DevBlockLabel name="ProductSizeChart" enabled={dev}>
              <ProductSizeChart />
            </DevBlockLabel>
            <DevBlockLabel name="ProductMeasurements" enabled={dev}>
              <ProductMeasurements measurements={product.measurements} />
            </DevBlockLabel>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
