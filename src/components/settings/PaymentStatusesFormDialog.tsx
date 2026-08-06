"use client";

import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PaymentStatusesList } from "@/components/settings/PaymentStatusesList";
import type { PaymentStatusRow } from "@/server/data/payment-statuses";

/** Довідник «Статуси оплат» — попап (не окрема сторінка, той самий патерн, що OrderStatusesFormDialog). */
export function PaymentStatusesFormDialog({
  trigger,
  statuses,
}: {
  trigger: ReactElement;
  statuses: PaymentStatusRow[];
}) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Статуси оплат</DialogTitle>
        </DialogHeader>
        <PaymentStatusesList statuses={statuses} />
      </DialogContent>
    </Dialog>
  );
}
