import Link from "next/link";
import { Plus } from "lucide-react";
import { WarehouseCard } from "@/components/warehouse/WarehouseCard";
import { getWarehouseCardMock } from "@/lib/mocks/warehouse-cards";
import type { WarehouseRow } from "@/server/data/warehouses";

export function WarehouseGrid({ warehouses }: { warehouses: WarehouseRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {warehouses.map((warehouse) => (
        <WarehouseCard key={warehouse.id} warehouse={warehouse} mock={getWarehouseCardMock(warehouse)} />
      ))}

      <Link
        href="/settings/warehouses/new"
        className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground transition-colors hover:border-accent-foreground/40 hover:text-accent-foreground"
      >
        <Plus className="size-5" />
        Створити новий склад
      </Link>
    </div>
  );
}
