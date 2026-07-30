import type { Metadata } from "next";
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsTable } from "@/components/products/ProductsTable";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { listProducts, type ProductStockFilter } from "@/server/data/products";
import { listCategories } from "@/server/data/categories";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import type { ProductStatus } from "@/lib/types/product";

export const metadata: Metadata = { title: "Товари" };

const PAGE_SIZE = 20;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    stock?: string;
    page?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tenantId = getDevTenantId();
  const page = Math.max(1, Number(sp.page) || 1);
  const status = (sp.status ?? "all") as ProductStatus | "all";
  const stock = (sp.stock ?? "all") as ProductStockFilter;
  const search = sp.q ?? "";
  const categoryId = sp.category ?? "";

  const [{ items, total }, categories] = await Promise.all([
    listProducts(tenantId, {
      search,
      categoryId: categoryId || null,
      status,
      stock,
      page,
      pageSize: PAGE_SIZE,
    }),
    listCategories(tenantId),
  ]);

  const dev = DEV_BLOCK_LABELS.products;

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="ProductsHeader" enabled={dev}>
        <ProductsHeader total={total} />
      </DevBlockLabel>

      <DevBlockLabel name="ProductsTable" enabled={dev}>
        <div className="flex flex-1 flex-col p-6">
          <ProductsTable
            items={items}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            categories={categories}
            filters={{ search, categoryId, status, stock }}
          />
        </div>
      </DevBlockLabel>
    </div>
  );
}
