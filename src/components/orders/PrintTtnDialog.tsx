"use client";

import { useState, useTransition, type ReactElement } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import type { PrintOrdersDocumentsResult } from "@/app/orders/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEV_USER } from "@/lib/constants/dev-user";
import { openPdfBlob } from "@/lib/open-pdf-blob";
import { CARRIER_LOGOS } from "@/lib/constants/carrier-logos";
import {
  DELIVERY_METHOD_LABEL,
  ORDER_STATUS_META,
  ORDER_STATUS_ORDER,
  TTN_PRINTABLE_CARRIERS,
  type DeliveryMethod,
  type OrderListItem,
  type OrderStatus,
  type PostPrintAction,
} from "@/lib/types/orders";

const NOTIFY_USER_OPTIONS = [DEV_USER.name];

function ordersWord(count: number): string {
  return count === 1 ? "замовлення" : "замовлень";
}

// Велика квадратна кнопка перевізника — лого+назва+кількість замовлень
// усередині (пряма вказівка людини). Клік друкує реальне маркування
// (100×100, Нова пошта) для замовлень цього перевізника з уже створеною ЕН —
// пряма вказівка людини, п'ятий прохід.
function CarrierButton({
  carrier,
  count,
  disabled,
  isPrinting,
  onClick,
}: {
  carrier: DeliveryMethod;
  count: number;
  disabled: boolean;
  isPrinting: boolean;
  onClick: () => void;
}) {
  const logo = CARRIER_LOGOS[carrier];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-border p-4 text-center transition-colors hover:border-primary hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-transparent"
    >
      {isPrinting ? (
        <Loader2 className="size-14 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        logo && <Image src={logo} alt="" width={56} height={56} className="size-14 shrink-0 rounded object-contain" />
      )}
      <span className="text-sm font-semibold text-foreground">{DELIVERY_METHOD_LABEL[carrier]}</span>
      <span className="text-xs text-muted-foreground">
        {count} {ordersWord(count)}
      </span>
    </button>
  );
}

export function PrintTtnDialog({
  trigger,
  selectedOrders,
  postPrintAction,
  onPostPrintActionChange,
  onPrint,
  onClose,
}: {
  trigger: ReactElement;
  selectedOrders: OrderListItem[];
  postPrintAction: PostPrintAction;
  onPostPrintActionChange: (action: PostPrintAction) => void;
  onPrint: (orderIds: string[]) => Promise<PrintOrdersDocumentsResult>;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [printingCarrier, setPrintingCarrier] = useState<DeliveryMethod | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);
  const [isPending, startPrinting] = useTransition();

  const counts = Object.fromEntries(
    TTN_PRINTABLE_CARRIERS.map((carrier) => [
      carrier,
      selectedOrders.filter((o) => o.carrierKey === carrier).length,
    ])
  ) as Record<DeliveryMethod, number>;
  const unsupportedCount = selectedOrders.length - Object.values(counts).reduce((a, b) => a + b, 0);

  function handlePrint(carrier: DeliveryMethod) {
    const ids = selectedOrders.filter((o) => o.carrierKey === carrier).map((o) => o.id);
    if (ids.length === 0) return;
    setPrintError(null);
    setPrintingCarrier(carrier);
    startPrinting(async () => {
      const result = await onPrint(ids);
      for (const pdf of result.pdfs) openPdfBlob(pdf);
      if (result.pdfs.length === 0) {
        setPrintError(result.skipped[0]?.reason ?? "Не вдалося сформувати друк");
      } else if (result.skipped.length > 0) {
        setPrintError(
          `Надруковано ${result.pdfs.length === 1 ? "1 файл" : `${result.pdfs.length} файли`}. ${result.skipped.length} ${ordersWord(result.skipped.length)} пропущено: ${result.skipped[0].reason}`
        );
      }
      setPrintingCarrier(null);
    });
    // Попап навмисно НЕ закривається — можна одразу надрукувати й іншого
    // перевізника (пряма вказівка людини), закриття лише хрестиком нижче.
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        // Закриття дозволене лише через явний хрестик (DialogClose, reason
        // "close-press") — клік по фону чи Escape ігноруються, пряма
        // вказівка людини.
        if (!nextOpen && eventDetails.reason !== "close-press") {
          eventDetails.cancel();
          return;
        }
        setOpen(nextOpen);
        if (!nextOpen) onClose();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Друк ТТН</DialogTitle>
          <DialogDescription>
            Обрано {selectedOrders.length} {ordersWord(selectedOrders.length)}. Оберіть перевізника —
            маркування друкується лише для замовлень цим перевізником.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {TTN_PRINTABLE_CARRIERS.map((carrier) => (
            <CarrierButton
              key={carrier}
              carrier={carrier}
              count={counts[carrier]}
              disabled={counts[carrier] === 0 || isPending}
              isPrinting={isPending && printingCarrier === carrier}
              onClick={() => handlePrint(carrier)}
            />
          ))}
        </div>

        {unsupportedCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {`${unsupportedCount} ${ordersWord(unsupportedCount)} з іншою доставкою (кур'єр/самовивіз) — ТТН для них не друкується.`}
          </p>
        )}

        {printError && <p className="text-sm text-destructive">{printError}</p>}

        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <span className="text-sm font-medium text-foreground">Дія після друку</span>

          <label className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={postPrintAction.changeStatus}
              disabled={postPrintAction.none}
              onCheckedChange={(v) => onPostPrintActionChange({ ...postPrintAction, changeStatus: !!v })}
            />
            Змінити статус на
            <Select
              value={postPrintAction.status}
              onValueChange={(v) => v && onPostPrintActionChange({ ...postPrintAction, status: v as OrderStatus })}
              disabled={postPrintAction.none || !postPrintAction.changeStatus}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue>{(v: string) => ORDER_STATUS_META[v as OrderStatus]?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ORDER_STATUS_META[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={postPrintAction.notify}
              disabled={postPrintAction.none}
              onCheckedChange={(v) => onPostPrintActionChange({ ...postPrintAction, notify: !!v })}
            />
            Повідомити
            <Select
              value={postPrintAction.notifyUser}
              onValueChange={(v) => v && onPostPrintActionChange({ ...postPrintAction, notifyUser: v })}
              disabled={postPrintAction.none || !postPrintAction.notify}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue>{() => postPrintAction.notifyUser || "Оберіть користувача"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {NOTIFY_USER_OPTIONS.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={postPrintAction.none}
              onCheckedChange={(v) =>
                onPostPrintActionChange(
                  v
                    ? { ...postPrintAction, none: true, changeStatus: false, notify: false }
                    : { ...postPrintAction, none: false }
                )
              }
            />
            Нічого не робити
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
