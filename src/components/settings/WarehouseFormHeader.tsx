import Link from "next/link";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { Button } from "@/components/ui/button";
import type { WarehouseRow } from "@/server/data/warehouses";

interface HeaderAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "outline";
}

// Той самий каркас, що CategoryFormHeader — крихти + HeaderActions зверху,
// назва + дія(ї) під ними; статус автозбереження показується тут-таки.
export function WarehouseFormHeader({
  warehouse,
  primaryAction,
  secondaryAction,
  statusMessage,
  errorMessage,
}: {
  warehouse: WarehouseRow | null;
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
          <Link href="/settings?tab=warehouses" className="hover:text-foreground">
            Склади
          </Link>
          <span>/</span>
          <span className="text-foreground">{warehouse ? warehouse.name : "Додати склад"}</span>
        </nav>
        <HeaderActions />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {warehouse ? warehouse.name : "Додати склад"}
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
