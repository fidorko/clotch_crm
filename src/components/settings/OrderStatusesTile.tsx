"use client";

import { ChevronRight, Workflow } from "lucide-react";
import { OrderStatusesFormDialog } from "@/components/settings/OrderStatusesFormDialog";
import type { OrderStatusRow } from "@/server/data/order-statuses";

const MAX_VISIBLE_VALUES = 7;

/** Плитка «Статуси замовлень» (системний довідник) — заголовок відкриває попап, без кошика на плитці (видалення — в попапі). */
export function OrderStatusesTile({ statuses }: { statuses: OrderStatusRow[] }) {
  const visible = statuses.slice(0, MAX_VISIBLE_VALUES);
  const hasMore = statuses.length > MAX_VISIBLE_VALUES;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <OrderStatusesFormDialog
        statuses={statuses}
        trigger={
          <button type="button" className="flex cursor-pointer items-start gap-3 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Workflow className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">Статуси замовлень</span>
              <span className="truncate text-xs text-muted-foreground">
                Пайплайн статусів + сповіщення про «зависання»
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">{statuses.length}</span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((status) => (
          <span
            key={status.id}
            className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            <span
              className="size-2 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: status.color }}
            />
            {status.name}
          </span>
        ))}
        {hasMore && (
          <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            …
          </span>
        )}
      </div>
    </div>
  );
}
