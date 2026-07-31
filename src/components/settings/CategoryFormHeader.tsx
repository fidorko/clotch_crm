import Link from "next/link";
import { HeaderActions } from "@/components/layout/HeaderActions";
import type { CategoryRow } from "@/server/data/categories";

export function CategoryFormHeader({ category }: { category: CategoryRow | null }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground">
            Налаштування
          </Link>
          <span>/</span>
          <Link href="/settings?tab=categories" className="hover:text-foreground">
            Категорії товару
          </Link>
          <span>/</span>
          <span className="text-foreground">{category ? category.name : "Додати категорію"}</span>
        </nav>
        <HeaderActions />
      </div>
      <h1 className="text-2xl font-semibold text-foreground">
        {category ? category.name : "Додати категорію"}
      </h1>
    </div>
  );
}
