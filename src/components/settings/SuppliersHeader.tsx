import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeaderActions } from "@/components/layout/HeaderActions";

// Той самий каркас, що ProductsHeader/SettingsHeader: рядок клікабельних крихт
// + HeaderActions праворуч, нижче заголовок + дія.
export function SuppliersHeader({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground">
            Налаштування
          </Link>
          <span>/</span>
          <Link href="/settings?tab=references" className="hover:text-foreground">
            Довідники
          </Link>
          <span>/</span>
          <span className="text-foreground">Постачальники</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Постачальники</h1>
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "постачальник" : "постачальників"}
          </span>
        </div>
        <Link href="/settings/references/suppliers/new" className={buttonVariants({ variant: "default" })}>
          <Plus className="size-4" />
          Додати постачальника
        </Link>
      </div>
    </div>
  );
}
