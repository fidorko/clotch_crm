import Link from "next/link";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { Button } from "@/components/ui/button";
import type { CategoryRow } from "@/server/data/categories";

interface HeaderAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "outline";
}

/** Save/Cancel живуть тут (не всередині вкладок) — той самий патерн, що ProductHeader:
 * дію завжди видно, не треба гортати вниз форми чи вкладки. Дію (яка саме вкладка
 * зараз активна) визначає CategoryForm і передає сюди готовими колбеками. */
export function CategoryFormHeader({
  category,
  primaryAction,
  secondaryAction,
  statusMessage,
  errorMessage,
}: {
  category: CategoryRow | null;
  primaryAction?: HeaderAction;
  secondaryAction?: HeaderAction;
  statusMessage?: string | null;
  errorMessage?: string | null;
}) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {category ? category.name : "Додати категорію"}
        </h1>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {secondaryAction && (
                <Button
                  type="button"
                  variant={secondaryAction.variant ?? "outline"}
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled}
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button type="button" onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
                  {primaryAction.label}
                </Button>
              )}
            </div>
            {errorMessage && <span className="text-xs text-destructive">{errorMessage}</span>}
            {!errorMessage && statusMessage && (
              <span className="text-xs text-muted-foreground">{statusMessage}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
