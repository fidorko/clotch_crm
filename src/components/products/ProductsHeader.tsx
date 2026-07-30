import { CreateProductButton } from "@/components/products/CreateProductButton";
import { ImportProductsButton } from "@/components/products/ImportProductsButton";

export function ProductsHeader({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="text-foreground">Товари</span>
      </nav>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Товари</h1>
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "товар" : "товарів"} у каталозі
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ImportProductsButton />
          <CreateProductButton />
        </div>
      </div>
    </div>
  );
}
