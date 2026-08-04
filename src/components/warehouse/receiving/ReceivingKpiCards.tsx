import type { LucideIcon } from "lucide-react";
import { CalendarDays, CheckCircle2, FileEdit, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTodayUa } from "@/lib/date-ua";
import type { ReceivingDocumentListItem } from "@/lib/types/receiving";

interface Kpi {
  label: string;
  value: number;
  icon: LucideIcon;
  tint: string;
}

export function ReceivingKpiCards({ documents }: { documents: ReceivingDocumentListItem[] }) {
  const today = formatTodayUa();
  const kpis: Kpi[] = [
    {
      label: "Всього документів",
      value: documents.length,
      icon: FileText,
      tint: "bg-accent text-accent-foreground",
    },
    {
      label: "Чернеток",
      value: documents.filter((d) => d.status === "draft").length,
      icon: FileEdit,
      tint: "bg-muted text-muted-foreground",
    },
    {
      label: "Проведених",
      value: documents.filter((d) => d.status === "posted").length,
      icon: CheckCircle2,
      tint: "bg-success/15 text-success",
    },
    {
      label: "Сьогодні",
      value: documents.filter((d) => d.date === today).length,
      icon: CalendarDays,
      tint: "bg-warning/15 text-warning",
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
