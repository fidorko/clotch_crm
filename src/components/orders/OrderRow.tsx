import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Camera, Copy, Download, Globe, Phone, Printer, ShoppingBag, Send, Truck as TruckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ORDER_SOURCE_LABEL,
  ORDER_STATUS_META,
  formatOrderSum,
  type OrderListItem,
  type OrderSource,
} from "@/lib/types/orders";

const ORDER_SOURCE_ICON: Record<OrderSource, { icon: LucideIcon; tint: string }> = {
  instagram: { icon: Camera, tint: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400" },
  website: { icon: Globe, tint: "bg-accent text-accent-foreground" },
  telegram: { icon: Send, tint: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400" },
  phone: { icon: Phone, tint: "bg-muted text-foreground/70" },
  olx: { icon: ShoppingBag, tint: "bg-warning/15 text-warning" },
};

function CustomerAvatar({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase();
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
      {letter}
    </span>
  );
}

function formatTtn(ttn: string): string {
  return ttn.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4");
}

// Дії (Копіювати/Друк/Експорт рядка) — усе ще заглушки, як RowActions у
// ReceivingDocumentsTable (масовий «Експорт» обраних — реальний, живе в
// OrdersHeader/OrdersPageClient). Перегляд самого замовлення — тепер реальне
// посилання на номер (четвертий прохід, orders-new-order-form.md — раніше
// клікнути не було куди, пряма вказівка людини).
function OrderRowActions({ number }: { number: string }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label={`Копіювати замовлення ${number}`}>
        <Copy className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={`Друк замовлення ${number}`}>
        <Printer className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={`Експорт замовлення ${number}`}>
        <Download className="size-4" />
      </Button>
    </div>
  );
}

export function OrderRow({
  order,
  selected,
  onToggleSelect,
}: {
  order: OrderListItem;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const statusMeta = ORDER_STATUS_META[order.status];
  const sourceMeta = ORDER_SOURCE_ICON[order.source];

  // Виділення чекбоксом або ctrl/cmd+клік по рядку (файл-менеджерний
  // патерн, пряма вказівка людини) — звичайний клік нічого не робить,
  // картки замовлення (/orders/[id]) ще нема.
  function handleRowClick(e: React.MouseEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onToggleSelect(order.id);
    }
  }

  return (
    <TableRow
      onClick={handleRowClick}
      className={cn(selected && "bg-accent/5 hover:bg-accent/10")}
    >
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(order.id)}
          aria-label={`Обрати замовлення ${order.number}`}
        />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2.5">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", sourceMeta.tint)}>
            <sourceMeta.icon className="size-4.5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/orders/${order.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-foreground hover:underline"
            >
              {order.number}
            </Link>
            <span className="text-xs text-muted-foreground" title={order.createdAt}>
              {order.createdAtRelative} · {ORDER_SOURCE_LABEL[order.source]}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2.5">
          <CustomerAvatar name={order.customer.name} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-foreground">{order.customer.name}</span>
            <span className="text-xs text-muted-foreground">{order.customer.phone}</span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="max-w-48 truncate text-foreground">
            {order.itemsSummary}
            {order.itemsCount > 1 && <span className="text-muted-foreground"> +{order.itemsCount - 1}</span>}
          </span>
          <span className="text-xs text-muted-foreground">{order.totalQuantity} шт.</span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col">
          <span className="text-foreground">{formatOrderSum(order.totalSum)}</span>
          <span className="text-xs text-muted-foreground">{order.paymentMethod}</span>
        </div>
      </TableCell>

      <TableCell>
        {order.paymentStatus ? (
          <Badge
            variant="outline"
            className="border-transparent"
            style={{ backgroundColor: `${order.paymentStatus.color}26`, color: order.paymentStatus.color }}
          >
            {order.paymentStatus.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-foreground">
            <TruckIcon className="size-3.5 shrink-0 text-muted-foreground" />
            {order.deliveryMethod?.name ?? "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {order.ttn ? formatTtn(order.ttn) : order.city}
          </span>
          {order.warehouse && (
            <span className="text-xs text-muted-foreground/70">зі складу «{order.warehouse}»</span>
          )}
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className={cn("border-transparent", statusMeta.className)}>
          {statusMeta.label}
        </Badge>
      </TableCell>

      <TableCell className="text-muted-foreground">{order.manager}</TableCell>

      <TableCell>
        <OrderRowActions number={order.number} />
      </TableCell>
    </TableRow>
  );
}
