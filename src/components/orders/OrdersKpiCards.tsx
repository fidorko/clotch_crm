import type { LucideIcon } from "lucide-react";
import { Bell, CheckCircle2, PackageSearch, ShoppingBag, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatOrderSum, type OrderListItem } from "@/lib/types/orders";

interface Kpi {
  label: string;
  value: string;
  icon: LucideIcon;
  tint: string;
}

// Показники за реальним статусом замовлення (мок — тут поки й самі
// замовлення мок, orders.md). "Сума за період" рахує лише не скасовані й
// не повернені — так само, як звичайна CRM-практика (валова виручка без
// відхилених замовлень).
export function OrdersKpiCards({ orders }: { orders: OrderListItem[] }) {
  const newCount = orders.filter((o) => o.status === "new").length;
  const processingCount = orders.filter((o) => o.status === "confirmed" || o.status === "processing").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "returned")
    .reduce((sum, o) => sum + o.totalSum, 0);

  const kpis: Kpi[] = [
    {
      label: "Всього замовлень",
      value: String(orders.length),
      icon: ShoppingBag,
      tint: "bg-accent text-accent-foreground",
    },
    {
      label: "Нові — потребують уваги",
      value: String(newCount),
      icon: Bell,
      tint: "bg-warning/15 text-warning",
    },
    {
      label: "В обробці",
      value: String(processingCount),
      icon: PackageSearch,
      tint: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    },
    {
      label: "Завершено",
      value: String(completedCount),
      icon: CheckCircle2,
      tint: "bg-success/15 text-success",
    },
    {
      label: "Сума замовлень",
      value: formatOrderSum(revenue),
      icon: Wallet,
      tint: "bg-success/15 text-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="gap-0 p-3.5">
          <CardContent className="flex items-center gap-3 p-0">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", kpi.tint)}>
              <kpi.icon className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xl font-semibold leading-tight text-foreground">{kpi.value}</span>
              <span className="truncate text-xs text-muted-foreground">{kpi.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
