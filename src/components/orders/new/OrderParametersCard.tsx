"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DiscountInput } from "@/components/orders/new/DiscountInput";
import { DEV_USER } from "@/lib/constants/dev-user";
import { formatOrderSum } from "@/lib/types/orders";
import { applyDiscount } from "@/lib/orders/discount";
import type { OrderDiscountTypeValue } from "@/server/data/orders";

export interface OrderParametersValues {
  legalEntityId: string;
  notes: string;
  discountType: OrderDiscountTypeValue | null;
  discountValue: string;
  promoCode: string;
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{formatOrderSum(value)}</span>
    </div>
  );
}

/**
 * Параметри замовлення — юридична особа переїхала в хедер форми (третій
 * прохід), тут лишається менеджер/користувач-що-створив (TODO(auth) —
 * DEV_USER), коментар, знижка на замовлення+промокод (четвертий прохід —
 * перенесено з видаленого OrderSummaryCard, пряма вказівка людини), і
 * деталізована картка «До оплати клієнтом» (товари після знижки+доставка+
 * комісія накладеного платежу). «Разом» тут — повна сума ДО сплати (не
 * плутати із «Сумою післяплати» в OrderDeliveryCard, яка 0 для передоплати —
 * четвертий прохід, баг-фікс: раніше «Разом» помилково брав ту саму формулу
 * й показував 0 для будь-якого способу оплати, крім накладеного платежу).
 */
export function OrderParametersCard({
  values,
  onChange,
  itemsTotal,
  deliveryCost,
  codCommission,
}: {
  values: OrderParametersValues;
  onChange: (patch: Partial<OrderParametersValues>) => void;
  itemsTotal: number;
  deliveryCost: number;
  codCommission: number;
}) {
  const [promoApplied, setPromoApplied] = useState(false);
  const afterDiscount = applyDiscount(itemsTotal, values.discountType, values.discountValue);
  const total = afterDiscount + deliveryCost + codCommission;

  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Параметри замовлення</span>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Менеджер</span>
            <p className="text-sm text-foreground">{DEV_USER.name}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Створив замовлення</span>
            <p className="text-sm text-foreground">{DEV_USER.name}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Коментар до замовлення</span>
          <Textarea value={values.notes} onChange={(e) => onChange({ notes: e.target.value })} rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Знижка на замовлення</span>
            <DiscountInput
              type={values.discountType}
              value={values.discountValue}
              onChange={(type, value) => onChange({ discountType: type, discountValue: value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Промокод</span>
            <div className="flex items-center gap-2">
              <Input
                value={values.promoCode}
                onChange={(e) => {
                  onChange({ promoCode: e.target.value });
                  setPromoApplied(false);
                }}
                placeholder="Код"
                className="h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!values.promoCode.trim()}
                onClick={() => setPromoApplied(true)}
              >
                Застосувати
              </Button>
            </div>
          </div>
        </div>
        {promoApplied && <p className="text-xs text-success">Промокод застосовано</p>}

        <div className="mt-auto flex flex-col gap-1.5 rounded-lg bg-accent/40 p-3">
          <span className="text-xs font-medium text-muted-foreground">До оплати клієнтом</span>
          <BreakdownRow label="Сума товарів" value={afterDiscount} />
          <BreakdownRow label="Доставка (з пакуванням)" value={deliveryCost} />
          {codCommission > 0 && <BreakdownRow label="Комісія накладеного платежу" value={codCommission} />}
          <div className="mt-1 flex items-center justify-between border-t border-border pt-1.5">
            <span className="text-sm font-medium text-foreground">Разом</span>
            <span className="text-2xl font-semibold text-foreground">{formatOrderSum(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
