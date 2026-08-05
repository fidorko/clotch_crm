import type { LucideIcon } from "lucide-react";
import { CalendarClock, CheckCircle2, FileText, Loader } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReceivingDocumentListItem } from "@/lib/types/receiving";

interface Kpi {
  label: string;
  value: number;
  icon: LucideIcon;
  tint: string;
}

// Лічильники за реальним статусом документа (раніше — за сирим
// `status`-полем, яке фактично завжди дорівнювало "draft"; тепер статус —
// повноцінна машина станів, warehouse-receiving.md, 2026-08-05).
export function ReceivingKpiCards({ documents }: { documents: ReceivingDocumentListItem[] }) {
  const kpis: Kpi[] = [
    {
      label: "Всього документів",
      value: documents.length,
      icon: FileText,
      tint: "bg-accent text-accent-foreground",
    },
    {
      label: "Очікується поставка",
      value: documents.filter((d) => d.status === "awaiting_delivery").length,
      icon: CalendarClock,
      tint: "bg-warning/15 text-warning",
    },
    {
      label: "В процесі",
      value: documents.filter((d) => d.status === "in_progress").length,
      icon: Loader,
      tint: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    },
    {
      label: "Завершено",
      value: documents.filter((d) => d.status === "completed" || d.status === "completed_with_discrepancy").length,
      icon: CheckCircle2,
      tint: "bg-success/15 text-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="gap-0 p-3.5">
          <CardContent className="flex items-center gap-3 p-0">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", kpi.tint)}>
              <kpi.icon className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-xl font-semibold leading-tight text-foreground">{kpi.value}</span>
              <span className="truncate text-xs text-muted-foreground">{kpi.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
