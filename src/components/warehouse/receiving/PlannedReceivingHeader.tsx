import Link from "next/link";
import { Check, PackageCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeaderActions } from "@/components/layout/HeaderActions";

export function PlannedReceivingHeader({
  documentType,
  onAccept,
  accepting,
  saveSlot,
}: {
  documentType: "planned" | "actual";
  // Присутній лише для планового документа — у фактичному "Прийняти на
  // склад" уже не рендериться (сам документ і є результатом приймання).
  onAccept?: () => void;
  accepting?: boolean;
  saveSlot: React.ReactNode;
}) {
  const title = documentType === "planned" ? "Планове надходження" : "Фактичне надходження";

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
          <span className="text-foreground">{title}</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <div className="flex items-center gap-2">
          {saveSlot}
          {onAccept && (
            <button type="button" onClick={onAccept} disabled={accepting} className={buttonVariants({})}>
              {accepting ? <Check className="size-4" /> : <PackageCheck className="size-4" />}
              Прийняти на склад
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
