"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { OrderCustomerCard } from "@/components/orders/new/OrderCustomerCard";
import { OrderItemsCard, orderLineItemsTotal, type OrderLineItem } from "@/components/orders/new/OrderItemsCard";
import { OrderDeliveryCard } from "@/components/orders/new/OrderDeliveryCard";
import {
  ORDER_PAYMENT_METHOD_OPTIONS,
  ORDER_SOURCE_LABEL,
  PAYMENT_STATUS_META,
  formatOrderSum,
  type OrderSource,
  type PaymentStatus,
} from "@/lib/types/orders";
import { createOrderAction, type CreateOrderResult } from "@/app/orders/new/actions";
import type { DeliveryMethodRow } from "@/server/data/delivery-methods";
import type { DeliveryMethodEntitySettingsRow } from "@/server/data/delivery-method-entity-settings";
import type { ProductSkuCatalogItem } from "@/server/data/product-skus";

interface FormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderLineItem[];
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  source: OrderSource;
  notes: string;
  deliveryMethodId: string;
  recipientName: string;
  recipientPhone: string;
  recipientCityRef: string;
  recipientCity: string;
  recipientWarehouseRef: string;
  recipientWarehouse: string;
  weightKg: string;
  seatsAmount: string;
  declaredValue: string;
  description: string;
  createShipmentNow: boolean;
}

const INITIAL_STATE: FormState = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  items: [],
  paymentMethod: ORDER_PAYMENT_METHOD_OPTIONS[0],
  paymentStatus: "unpaid",
  source: "website",
  notes: "",
  deliveryMethodId: "",
  recipientName: "",
  recipientPhone: "",
  recipientCityRef: "",
  recipientCity: "",
  recipientWarehouseRef: "",
  recipientWarehouse: "",
  weightKg: "0.5",
  seatsAmount: "1",
  declaredValue: "0",
  description: "",
  createShipmentNow: false,
};

function SuccessPanel({ result, onCreateAnother }: { result: Extract<CreateOrderResult, { ok: true }>; onCreateAnother: () => void }) {
  return (
    <Card className="gap-3 p-6">
      <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <h2 className="text-xl font-semibold text-foreground">Замовлення {result.order.number} створено</h2>
        <p className="text-sm text-muted-foreground">Сума: {formatOrderSum(Number(result.order.totalSum))}</p>
        {result.order.ttn && (
          <p className="text-sm text-foreground">
            ТТН Нової пошти: <span className="font-semibold">{result.order.ttn}</span>
          </p>
        )}
        {result.shipmentError && (
          <p className="max-w-md text-sm text-destructive">
            Замовлення створено, але ЕН не вдалось оформити: {result.shipmentError}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" render={<Link href="/orders" />} nativeButton={false}>
            До списку замовлень
          </Button>
          <Button onClick={onCreateAnother}>Створити ще одне замовлення</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrderForm({
  deliveryMethods,
  entitySettingsByMethodId,
  skuCatalog,
}: {
  deliveryMethods: DeliveryMethodRow[];
  entitySettingsByMethodId: Record<string, DeliveryMethodEntitySettingsRow>;
  skuCatalog: ProductSkuCatalogItem[];
}) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [result, setResult] = useState<CreateOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  const total = orderLineItemsTotal(form.items);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const response = await createOrderAction({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        items: form.items.map((item) => ({
          productSkuId: item.productSkuId,
          productName: item.productName,
          sku: item.sku,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice) || 0,
        })),
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentStatus,
        source: form.source,
        notes: form.notes,
        deliveryMethodId: form.deliveryMethodId,
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
        recipientCityRef: form.recipientCityRef,
        recipientCity: form.recipientCity,
        recipientWarehouseRef: form.recipientWarehouseRef,
        recipientWarehouse: form.recipientWarehouse,
        weightKg: form.weightKg,
        seatsAmount: form.seatsAmount,
        declaredValue: form.declaredValue,
        description: form.description,
        createShipmentNow: form.createShipmentNow,
      });
      if (!response.ok) {
        setError(response.message);
        return;
      }
      setResult(response);
    });
  }

  if (result?.ok) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <SuccessPanel
          result={result}
          onCreateAnother={() => {
            setForm(INITIAL_STATE);
            setResult(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/orders" className="hover:text-foreground">
            Замовлення
          </Link>
          <span>/</span>
          <span className="text-foreground">Нове замовлення</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] items-start gap-4 px-6 pb-6">
        <div className="flex flex-col gap-4">
          <OrderCustomerCard
            values={form}
            onChange={patch}
          />
          <OrderItemsCard items={form.items} catalog={skuCatalog} onChange={(items) => patch({ items })} />

          <Card className="gap-3 p-4">
            <CardContent className="flex flex-col gap-3 p-0">
              <span className="text-lg font-semibold text-foreground">Оплата й джерело</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Спосіб оплати</span>
                  <Select value={form.paymentMethod} onValueChange={(v) => v && patch({ paymentMethod: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: string) => v}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Статус оплати</span>
                  <Select
                    value={form.paymentStatus}
                    onValueChange={(v) => v && patch({ paymentStatus: v as PaymentStatus })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: PaymentStatus) => PAYMENT_STATUS_META[v].label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PAYMENT_STATUS_META) as PaymentStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {PAYMENT_STATUS_META[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Джерело</span>
                  <Select value={form.source} onValueChange={(v) => v && patch({ source: v as OrderSource })}>
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
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Коментар до замовлення</span>
                <Textarea value={form.notes} onChange={(e) => patch({ notes: e.target.value })} rows={2} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <OrderDeliveryCard
            values={form}
            onChange={patch}
            deliveryMethods={deliveryMethods}
            entitySettingsByMethodId={entitySettingsByMethodId}
            orderTotal={total}
          />

          {error && (
            <Card className="gap-2 border-destructive/40 p-4">
              <CardContent className="p-0 text-sm text-destructive">{error}</CardContent>
            </Card>
          )}

          <Button onClick={handleSubmit} disabled={isPending || form.items.length === 0} size="lg">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Створити замовлення
          </Button>
        </div>
      </div>
    </div>
  );
}
