"use client";

import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OrderStatusesList } from "@/components/settings/OrderStatusesList";
import type { OrderStatusRow } from "@/server/data/order-statuses";

/** Довідник «Статуси замовлень» — попап (не окрема сторінка, за прямою вказівкою), той самий OrderStatusesList усередині. */
export function OrderStatusesFormDialog({
  trigger,
  statuses,
}: {
  trigger: ReactElement;
  statuses: OrderStatusRow[];
}) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Статуси замовлень</DialogTitle>
        </DialogHeader>
        <OrderStatusesList statuses={statuses} />
      </DialogContent>
    </Dialog>
  );
}
