import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ProductHeader } from "@/components/products/ProductHeader";
import { ProductEditorProvider } from "@/components/products/ProductEditorContext";
import { ProductTabs } from "@/components/products/ProductTabs";
import { ProductGeneralTab } from "@/components/products/ProductGeneralTab";
import { ProductSizeChart } from "@/components/products/ProductSizeChart";
import { ProductMeasurements } from "@/components/products/ProductMeasurements";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { getProductById } from "@/server/data/products";
import { listCategories } from "@/server/data/categories";
import { listColors } from "@/server/data/colors";
import { listSuppliers } from "@/server/data/suppliers";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

type PageProps = { params: Promise<{ id: string }> };

// cache() дедуплікує запит між generateMetadata і сторінкою в межах одного рендеру.
const loadProduct = cache((id: string) => getProductById(getDevTenantId(), id));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);
  return { title: product?.name ?? "Товар не знайдено" };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();
  const dev = DEV_BLOCK_LABELS.products;
  const [categories, colors, suppliers] = await Promise.all([
    listCategories(getDevTenantId()),
    listColors(getDevTenantId()),
    listSuppliers(getDevTenantId()),
  ]);
  const colorOptions = colors.map((color) => ({ name: color.name, hex: color.hex }));

  return (
    <div className="flex flex-1 flex-col">
      <ProductEditorProvider product={product} categories={categories}>
        <DevBlockLabel name="ProductHeader" enabled={dev}>
          <ProductHeader product={product} categories={categories} />
        </DevBlockLabel>
        <Tabs defaultValue="general" className="flex flex-1 flex-col">
          <DevBlockLabel name="ProductTabs" enabled={dev}>
            <ProductTabs />
          </DevBlockLabel>

          <TabsContent value="general" className="flex flex-col gap-4 p-6">
            <ProductGeneralTab
              product={product}
              categories={categories}
              colorOptions={colorOptions}
              suppliers={suppliers}
              dev={dev}
            />
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
      </ProductEditorProvider>
    </div>
  );
}
