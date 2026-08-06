"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaymentMethodPartialAmountRow, PaymentMethodRow } from "@/server/data/payment-methods";
import type { PaymentStatusRow } from "@/server/data/payment-statuses";
import { formatOrderSum } from "@/lib/types/orders";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

const MANUAL_PARTIAL_AMOUNT = "__manual__";

export interface OrderPaymentValues {
  paymentMethodId: string;
  partialAmount: string;
  paymentStatusId: string;
}

/**
 * Оплата — реальний спосіб тенанта (settings → Оплата), для «Часткова
 * оплата» — реальні варіанти суми (payment_method_partial_amounts) або
 * ручний ввід; статус оплати — реальний довідник payment_statuses.
 */
export function OrderPaymentCard({
  values,
  onChange,
  paymentMethods,
  partialAmounts,
  paymentStatuses,
}: {
  values: OrderPaymentValues;
  onChange: (patch: Partial<OrderPaymentValues>) => void;
  paymentMethods: PaymentMethodRow[];
  partialAmounts: PaymentMethodPartialAmountRow[];
  paymentStatuses: PaymentStatusRow[];
}) {
  const selectedMethod = paymentMethods.find((m) => m.id === values.paymentMethodId) ?? null;
  const isPartial = selectedMethod?.kind === "partial_payment";
  const methodAmounts = partialAmounts.filter((a) => a.paymentMethodId === values.paymentMethodId);
  const selectedStatus = paymentStatuses.find((s) => s.id === values.paymentStatusId) ?? null;
  const isManualAmount = !methodAmounts.some((a) => a.amount === values.partialAmount);

  return (
    <Card className="h-full gap-3 p-4">
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Оплата</span>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Спосіб оплати</FieldLabel>
          <Select
            value={values.paymentMethodId}
            onValueChange={(v) => v && onChange({ paymentMethodId: v, partialAmount: "" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{() => selectedMethod?.name ?? "Оберіть спосіб оплати"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isPartial && (
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Сума часткової оплати</FieldLabel>
            <Select
              value={isManualAmount ? MANUAL_PARTIAL_AMOUNT : values.partialAmount}
              onValueChange={(v) => {
                if (!v || v === MANUAL_PARTIAL_AMOUNT) return;
                onChange({ partialAmount: v });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() =>
                    isManualAmount
                      ? "Ввести вручну"
                      : formatOrderSum(Number(values.partialAmount))
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {methodAmounts.map((a) => (
                  <SelectItem key={a.id} value={a.amount}>
                    {formatOrderSum(Number(a.amount))}
                  </SelectItem>
                ))}
                <SelectItem value={MANUAL_PARTIAL_AMOUNT}>Ввести вручну</SelectItem>
              </SelectContent>
            </Select>
            {isManualAmount && (
              <DecimalInput
                value={values.partialAmount}
                onChange={(v) => onChange({ partialAmount: v })}
                placeholder="Сума, грн"
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Статус оплати</FieldLabel>
          <Select value={values.paymentStatusId} onValueChange={(v) => v && onChange({ paymentStatusId: v })}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {() =>
                  selectedStatus ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: selectedStatus.color }}
                      />
                      {selectedStatus.name}
                    </span>
                  ) : (
                    "Оберіть статус"
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {paymentStatuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
