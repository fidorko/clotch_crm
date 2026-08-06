"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_SOURCE_LABEL, ORDER_STATUS_META, type OrderSource } from "@/lib/types/orders";
import type { OrderStatusValue } from "@/server/data/orders";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

export interface OrderScheduleValues {
  orderDate: string;
  expectedShipmentDate: string;
  status: OrderStatusValue;
  source: OrderSource;
}

/** Дата замовлення/відвантаження (DatePicker), статус пайплайну (auto-дефолт з OrderForm), джерело. */
export function OrderScheduleCard({
  values,
  onChange,
}: {
  values: OrderScheduleValues;
  onChange: (patch: Partial<OrderScheduleValues>) => void;
}) {
  return (
    <Card className="gap-3 p-4">
      <CardContent className="grid grid-cols-2 gap-3 p-0">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Дата замовлення</FieldLabel>
          <DatePicker value={values.orderDate} onChange={(v) => onChange({ orderDate: v })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Очікувана дата відвантаження</FieldLabel>
          <DatePicker value={values.expectedShipmentDate} onChange={(v) => onChange({ expectedShipmentDate: v })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Статус замовлення</FieldLabel>
          <Select value={values.status} onValueChange={(v) => v && onChange({ status: v as OrderStatusValue })}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: OrderStatusValue) => ORDER_STATUS_META[v].label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ORDER_STATUS_META) as OrderStatusValue[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_META[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Джерело замовлення</FieldLabel>
          <Select value={values.source} onValueChange={(v) => v && onChange({ source: v as OrderSource })}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: OrderSource) => ORDER_SOURCE_LABEL[v]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ORDER_SOURCE_LABEL) as OrderSource[]).map((source) => (
                <SelectItem key={source} value={source}>
                  {ORDER_SOURCE_LABEL[source]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
