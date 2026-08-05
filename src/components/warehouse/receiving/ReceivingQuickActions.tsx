import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { FileCheck2, PackagePlus, Printer, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS: { label: string; icon: LucideIcon; href: string; tint: string }[] = [
  { label: "Друк етикеток", icon: Printer, href: "#", tint: "bg-success/15 text-success" },
  { label: "Створити новий товар", icon: PackagePlus, href: "/products", tint: "bg-accent text-accent-foreground" },
  { label: "Надіслати постачальнику", icon: Send, href: "#", tint: "bg-accent text-accent-foreground" },
];

// "Прийняти на склад" — у шапці (PlannedReceivingHeader). Один набір дій для
// обох видів надходження — документ тепер один (warehouse-receiving.md,
// 2026-08-05). «Акт приймання-передачі» — реальна дія (замінила «Дублювати
// документ»), доступна лише після завершення документа (completedAt).
export function ReceivingQuickActions({ documentId, completed }: { documentId: string; completed: boolean }) {
  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Швидкі дії</span>

        <div className="grid grid-cols-2 gap-2.5">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background py-3 text-center text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
            >
              <span className={cn("flex size-8 items-center justify-center rounded-lg", action.tint)}>
                <action.icon className="size-4" />
              </span>
              {action.label}
            </Link>
          ))}

          {completed ? (
            <a
              href={`/api/receiving/${documentId}/act`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background py-3 text-center text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <FileCheck2 className="size-4" />
              </span>
              Акт приймання-передачі
            </a>
          ) : (
            <span
              title="Доступно після завершення надходження"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background py-3 text-center text-xs font-medium text-muted-foreground opacity-50"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <FileCheck2 className="size-4" />
              </span>
              Акт приймання-передачі
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
