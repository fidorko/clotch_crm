import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Copy, History, PackagePlus, Printer, ScanLine, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACTUAL_ACTIONS: { label: string; icon: LucideIcon; href: string; tint: string }[] = [
  { label: "Сканувати товар", icon: ScanLine, href: "#", tint: "bg-accent text-accent-foreground" },
  { label: "Друк етикеток", icon: Printer, href: "#", tint: "bg-success/15 text-success" },
  { label: "Створити новий товар", icon: PackagePlus, href: "/products", tint: "bg-accent text-accent-foreground" },
  { label: "Перегляд історії", icon: History, href: "#", tint: "bg-accent text-accent-foreground" },
];

// Для планового надходження "Сканувати товар"/"Перегляд історії" не мають
// сенсу (товар ще фізично не прибув) — замінено на дії, актуальні саме на
// етапі планування (пряма вказівка людини, warehouse-receiving.md).
const PLANNED_ACTIONS: { label: string; icon: LucideIcon; href: string; tint: string }[] = [
  { label: "Друк етикеток", icon: Printer, href: "#", tint: "bg-success/15 text-success" },
  { label: "Створити новий товар", icon: PackagePlus, href: "/products", tint: "bg-accent text-accent-foreground" },
  { label: "Надіслати постачальнику", icon: Send, href: "#", tint: "bg-accent text-accent-foreground" },
  { label: "Дублювати документ", icon: Copy, href: "#", tint: "bg-warning/15 text-warning" },
];

// "Перейти до фактичного прийому" (тепер "Прийняти на склад") переїхав у
// шапку форми (ReceivingFormHeader, поруч зі "Зберегти") — пряма вказівка
// людини, тут більше не рендериться.
export function ReceivingQuickActions({ type }: { type: "planned" | "actual" }) {
  const isPlanned = type === "planned";
  const actions = isPlanned ? PLANNED_ACTIONS : ACTUAL_ACTIONS;

  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Швидкі дії</span>

        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((action) => (
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
        </div>
      </CardContent>
    </Card>
  );
}
