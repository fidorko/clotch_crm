"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteIconButton } from "@/components/ui/confirm-delete-button";
import { PaymentMethodFormDialog } from "@/components/settings/PaymentMethodFormDialog";
import type { PaymentMethodPartialAmountRow, PaymentMethodRow } from "@/server/data/payment-methods";
import {
  deletePaymentMethodAction,
  togglePaymentMethodAction,
} from "@/app/settings/payment/actions";
import { PAYMENT_METHOD_KIND_ICONS } from "@/lib/constants/payment-methods";

function statusOf(
  method: PaymentMethodRow,
  amountsCount: number
): { label: string; variant: "success" | "secondary" | "warning" } {
  if (!method.isEnabled) return { label: "Не активний", variant: "secondary" };
  if (method.kind === "partial_payment" && amountsCount === 0) {
    return { label: "Потрібні суми", variant: "warning" };
  }
  return { label: "Активний", variant: "success" };
}

export function PaymentMethodsTab({
  paymentMethods,
  partialAmounts,
}: {
  paymentMethods: PaymentMethodRow[];
  partialAmounts: PaymentMethodPartialAmountRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleToggle(method: PaymentMethodRow, isEnabled: boolean) {
    setActionError(null);
    setPendingId(method.id);
    startTransition(async () => {
      try {
        await togglePaymentMethodAction(method.id, method, isEnabled);
        refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося змінити стан");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleDelete(id: string) {
    setActionError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await deletePaymentMethodAction(id);
        refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити спосіб оплати");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Способи оплати, доступні під час оформлення замовлення.
        </p>
        <PaymentMethodFormDialog
          onSaved={refresh}
          trigger={
            <Button>
              <Plus className="size-4" />
              Додати спосіб оплати
            </Button>
          }
        />
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="gap-0 py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Увімкнено</TableHead>
                <TableHead>Назва</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((method) => {
                const isRowPending = pendingId === method.id;
                const methodAmounts = partialAmounts.filter((a) => a.paymentMethodId === method.id);
                const status = statusOf(method, methodAmounts.length);
                const Icon = PAYMENT_METHOD_KIND_ICONS[method.kind];
                return (
                  <TableRow key={method.id}>
                    <TableCell>
                      <Switch
                        checked={method.isEnabled}
                        onCheckedChange={(v) => handleToggle(method, v)}
                        disabled={isRowPending}
                        aria-label={`Увімкнути ${method.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        {method.name}
                        {methodAmounts.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({methodAmounts.map((a) => a.amount.replace(".", ",")).join(" / ")} грн)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <PaymentMethodFormDialog
                          method={method}
                          partialAmounts={methodAmounts}
                          onSaved={refresh}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Редагувати спосіб оплати ${method.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDeleteIconButton
                          ariaLabel={`Видалити спосіб оплати ${method.name}`}
                          title="Видалити спосіб оплати?"
                          description={`«${method.name}» буде видалено безповоротно.`}
                          onConfirm={() => handleDelete(method.id)}
                          className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paymentMethods.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Способів оплати ще немає — натисніть «Додати спосіб оплати»
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
