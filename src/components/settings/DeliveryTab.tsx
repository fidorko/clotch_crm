"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { DeliveryMethodFormDialog } from "@/components/settings/DeliveryMethodFormDialog";
import type { DeliveryMethodRow, DeliveryMethodStatusRuleRow } from "@/server/data/delivery-methods";
import type { OrderStatusRow } from "@/server/data/order-statuses";
import {
  deleteDeliveryMethodAction,
  toggleDeliveryMethodAction,
} from "@/app/settings/delivery/actions";
import { CARRIER_LOGOS } from "@/lib/constants/carrier-logos";

function statusOf(method: DeliveryMethodRow): { label: string; variant: "success" | "secondary" | "warning" } {
  if (!method.isEnabled) return { label: "Не активний", variant: "secondary" };
  if (method.requiresApiKey && !method.apiKey) return { label: "Потрібен ключ", variant: "warning" };
  return { label: "Активний", variant: "success" };
}

export function DeliveryTab({
  deliveryMethods,
  statusRules,
  orderStatuses,
}: {
  deliveryMethods: DeliveryMethodRow[];
  statusRules: DeliveryMethodStatusRuleRow[];
  orderStatuses: OrderStatusRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleToggle(method: DeliveryMethodRow, isEnabled: boolean) {
    setActionError(null);
    setPendingId(method.id);
    startTransition(async () => {
      try {
        await toggleDeliveryMethodAction(method.id, method, isEnabled);
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
        await deleteDeliveryMethodAction(id);
        refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити спосіб доставки");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Способи доставки, доступні під час оформлення замовлення.
        </p>
        <DeliveryMethodFormDialog
          orderStatuses={orderStatuses}
          onSaved={refresh}
          trigger={
            <Button>
              <Plus className="size-4" />
              Додати спосіб доставки
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
              {deliveryMethods.map((method) => {
                const isRowPending = pendingId === method.id;
                const status = statusOf(method);
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
                        {CARRIER_LOGOS[method.carrierKey] && (
                          <Image
                            src={CARRIER_LOGOS[method.carrierKey]}
                            alt=""
                            width={20}
                            height={20}
                            className="rounded object-contain"
                            unoptimized
                          />
                        )}
                        {method.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <DeliveryMethodFormDialog
                          method={method}
                          statusRules={statusRules.filter((r) => r.deliveryMethodId === method.id)}
                          orderStatuses={orderStatuses}
                          onSaved={refresh}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Редагувати спосіб доставки ${method.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDeleteIconButton
                          ariaLabel={`Видалити спосіб доставки ${method.name}`}
                          title="Видалити спосіб доставки?"
                          description={`«${method.name}» буде видалено безповоротно.`}
                          onConfirm={() => handleDelete(method.id)}
                          className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {deliveryMethods.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Способів доставки ще немає — натисніть «Додати спосіб доставки»
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
