"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  ClipboardList,
  MapPin,
  MoreVertical,
  Package,
  PackagePlus,
  PieChart,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WarehouseIllustration } from "@/components/warehouse/WarehouseIllustration";
import { cn } from "@/lib/utils";
import { WAREHOUSE_STATUS_META, type WarehouseCardMock } from "@/lib/mocks/warehouse-cards";
import type { WarehouseRow } from "@/server/data/warehouses";

const STATS: { key: keyof WarehouseCardMock; icon: LucideIcon; label: string; tint: string }[] = [
  { key: "skuCount", icon: Package, label: "SKU", tint: "bg-accent text-accent-foreground" },
  { key: "cellsCount", icon: MapPin, label: "Комірок", tint: "bg-accent text-accent-foreground" },
  { key: "fillPercent", icon: PieChart, label: "Заповнення", tint: "bg-success/15 text-success" },
  { key: "problemsCount", icon: AlertTriangle, label: "Проблеми", tint: "bg-warning/15 text-warning" },
];

const OPERATIONS: { label: string; icon: LucideIcon; href: string; tint: string }[] = [
  { label: "Залишки", icon: Package, href: "#", tint: "bg-accent text-accent-foreground" },
  { label: "Надходження", icon: PackagePlus, href: "#", tint: "bg-success/15 text-success" },
  { label: "Переміщення", icon: ArrowLeftRight, href: "#", tint: "bg-accent text-accent-foreground" },
  { label: "Коригування", icon: Pencil, href: "#", tint: "bg-warning/15 text-warning" },
  { label: "Списання", icon: Trash2, href: "#", tint: "bg-destructive/10 text-destructive" },
  { label: "Інвентаризація", icon: ClipboardList, href: "#", tint: "bg-accent text-accent-foreground" },
];

function shortAddress(warehouse: WarehouseRow): string {
  const parts = [warehouse.city, warehouse.address].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Адреса не вказана";
}

function statValue(mock: WarehouseCardMock, key: keyof WarehouseCardMock): string {
  const raw = mock[key];
  if (key === "fillPercent") return `${raw}%`;
  return Number(raw).toLocaleString("uk-UA");
}

export function WarehouseCard({
  warehouse,
  mock,
}: {
  warehouse: WarehouseRow;
  mock: WarehouseCardMock;
}) {
  const status = WAREHOUSE_STATUS_META[mock.status];

  return (
    <Card className="gap-3.5 p-4">
      <CardContent className="flex flex-col gap-3.5 p-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent">
              <WarehouseIllustration className="size-8" />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5 pt-0.5">
              <span className="truncate text-lg font-semibold text-foreground leading-tight">
                {warehouse.name}
              </span>
              <Badge variant={status.badge} className="w-fit gap-1">
                <span className={cn("size-1.5 rounded-full", status.dot)} />
                {status.label}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={`Дії зі складом ${warehouse.name}`}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/settings/warehouses/${warehouse.id}`} />}>
                Редагувати склад
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="#" />}>Журнал</DropdownMenuItem>
              <DropdownMenuItem render={<Link href="#" />}>Незавершені операції</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{shortAddress(warehouse)}</span>
        </div>

        <div className="grid grid-cols-4 divide-x divide-border rounded-xl bg-muted/50">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1.5 py-3">
              <span className={cn("flex size-8 items-center justify-center rounded-full", stat.tint)}>
                <stat.icon className="size-4" />
              </span>
              <span className="text-base font-semibold text-foreground leading-tight">
                {statValue(mock, stat.key)}
              </span>
              <span className="text-[0.7rem] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Операції складу</span>
          <div className="grid grid-cols-2 gap-2.5">
            {OPERATIONS.map((op) => (
              <Link
                key={op.label}
                href={
                  op.label === "Надходження"
                    ? `/warehouse/receiving?warehouseId=${warehouse.id}`
                    : op.href
                }
                className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", op.tint)}>
                  <op.icon className="size-4" />
                </span>
                {op.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Остання активність: {mock.lastActivity}</span>
          <Link href="#" className="font-medium text-accent-foreground hover:underline">
            Переглянути
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
