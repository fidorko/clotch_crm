import Link from "next/link";
import { CalendarClock, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeaderActions } from "@/components/layout/HeaderActions";

export function ReceivingHeader({ warehouseId }: { warehouseId?: string }) {
  const query = warehouseId ? `&warehouseId=${warehouseId}` : "";

  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/warehouse" className="hover:text-foreground">
            Склад
          </Link>
          <span>/</span>
          <span className="text-foreground">Надходження</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Надходження</h1>
        <div className="flex items-center gap-2">
          <Link href={`/warehouse/receiving/new?type=planned${query}`} className={buttonVariants({ variant: "outline" })}>
            <CalendarClock className="size-4" />
            Планове надходження
          </Link>
          <Link href={`/warehouse/receiving/new?type=actual${query}`} className={buttonVariants({})}>
            <Zap className="size-4" />
            Швидке надходження
          </Link>
        </div>
      </div>
    </div>
  );
}
