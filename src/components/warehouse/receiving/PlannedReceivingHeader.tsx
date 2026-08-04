import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeaderActions } from "@/components/layout/HeaderActions";

export function PlannedReceivingHeader({
  warehouseId,
  saveSlot,
}: {
  warehouseId?: string;
  saveSlot: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/warehouse" className="hover:text-foreground">
            Склад
          </Link>
          <span>/</span>
          <Link href="/warehouse/receiving" className="hover:text-foreground">
            Надходження
          </Link>
          <span>/</span>
          <span className="text-foreground">Планове надходження</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Планове надходження</h1>
        <div className="flex items-center gap-2">
          {saveSlot}
          <Link
            href={`/warehouse/receiving/new?type=actual${warehouseId ? `&warehouseId=${warehouseId}` : ""}`}
            className={buttonVariants({})}
          >
            <PackageCheck className="size-4" />
            Прийняти на склад
          </Link>
        </div>
      </div>
    </div>
  );
}
