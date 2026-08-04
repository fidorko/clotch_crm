import Link from "next/link";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { SaveReceivingButton } from "@/components/warehouse/receiving/SaveReceivingButton";

// Швидке/фактичне надходження — планове тепер має власну сторінку-оркестратор
// (PlannedReceivingWorkspace/PlannedReceivingHeader), не ділить цей компонент
// (warehouse-receiving.md, третій прохід).
export function ReceivingFormHeader() {
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
          <span className="text-foreground">Швидке надходження</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Швидке надходження</h1>
        <SaveReceivingButton />
      </div>
    </div>
  );
}
