import { HeaderActions } from "@/components/layout/HeaderActions";

export function WarehouseHeader({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="text-foreground">Склад</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Склад</h1>
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "склад" : "складів"}
          </span>
        </div>
      </div>
    </div>
  );
}
