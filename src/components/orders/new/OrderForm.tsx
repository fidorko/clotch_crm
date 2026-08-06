"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, FileText, Loader2, Printer, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { parseDateInputToIso } from "@/components/ui/date-input";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { formatTodayUa } from "@/lib/date-ua";
import { applyDiscount } from "@/lib/orders/discount";
import { sumPackageDims } from "@/lib/orders/package-dims";
import { OrderCustomerCard, fullCustomerName, type OrderCustomerValues } from "@/components/orders/new/OrderCustomerCard";
import { OrderItemsCard, orderLineItemsTotal, type OrderLineItem } from "@/components/orders/new/OrderItemsCard";
import { OrderPaymentCard, type OrderPaymentValues } from "@/components/orders/new/OrderPaymentCard";
import { OrderDeliveryCard, type OrderDeliveryValues } from "@/components/orders/new/OrderDeliveryCard";
import { OrderParametersCard, type OrderParametersValues } from "@/components/orders/new/OrderParametersCard";
import { OrderScheduleCard, type OrderScheduleValues } from "@/components/orders/new/OrderScheduleCard";
import { formatOrderSum } from "@/lib/types/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOrderAction, printShipmentDocumentsAction, type CreateOrderResult } from "@/app/orders/new/actions";
import { openPdfBlob } from "@/lib/open-pdf-blob";
import type { DeliveryMethodRow } from "@/server/data/delivery-methods";
import type { DeliveryMethodEntitySettingsRow } from "@/server/data/delivery-method-entity-settings";
import type { ProductSkuCatalogItem } from "@/server/data/product-skus";
import type { WarehouseRow } from "@/server/data/warehouses";
import type { PaymentMethodPartialAmountRow, PaymentMethodRow } from "@/server/data/payment-methods";
import type { PaymentStatusRow } from "@/server/data/payment-statuses";
import type { CompanyLegalEntityRow } from "@/server/data/company-legal-entities";

const dev = DEV_BLOCK_LABELS.orders;

function SuccessPanel({ result, onCreateAnother }: { result: Extract<CreateOrderResult, { ok: true }>; onCreateAnother: () => void }) {
  const [printError, setPrintError] = useState<string | null>(null);
  const [isPrinting, startPrinting] = useTransition();

  function handlePrint(kind: "document" | "marking") {
    setPrintError(null);
    startPrinting(async () => {
      const response = await printShipmentDocumentsAction(result.order.id, kind);
      if (!response.ok) {
        setPrintError(response.message);
        return;
      }
      openPdfBlob(response.pdfBase64);
    });
  }

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
        {result.order.ttn && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={isPrinting} onClick={() => handlePrint("document")}>
              {isPrinting && <Loader2 className="size-4 animate-spin" />}
              Друк ЕН
            </Button>
            <Button variant="outline" size="sm" disabled={isPrinting} onClick={() => handlePrint("marking")}>
              {isPrinting && <Loader2 className="size-4 animate-spin" />}
              Друк маркування
            </Button>
          </div>
        )}
        {printError && <p className="max-w-md text-sm text-destructive">{printError}</p>}
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

function StubHeaderButton({ label, icon: Icon, disabled = true }: { label: string; icon: typeof FileText; disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" disabled={disabled} type="button" />}>
        <Icon className="size-4" />
        {label}
      </TooltipTrigger>
      <TooltipContent>Поки без функціоналу</TooltipContent>
    </Tooltip>
  );
}

const INITIAL_CUSTOMER: OrderCustomerValues = {
  customerLastName: "",
  customerFirstName: "",
  customerMiddleName: "",
  customerPhone: "",
  customerEmail: "",
  customerComment: "",
};

const INITIAL_DELIVERY: OrderDeliveryValues = {
  deliveryMethodId: "",
  npType: "warehouse",
  recipientIsDifferent: false,
  recipientName: "",
  recipientPhone: "",
  recipientCityRef: "",
  recipientCity: "",
  recipientWarehouseRef: "",
  recipientWarehouse: "",
  recipientStreetRef: "",
  recipientStreet: "",
  recipientHouseNumber: "",
  weightKg: "",
  packageLengthCm: "",
  packageWidthCm: "",
  packageHeightCm: "",
  seatsAmount: "1",
  declaredValue: "0",
  usePackaging: false,
  packagingRef: "",
  packagingName: "",
  deliveryCost: "",
  codCommission: "",
  shipment: null,
};

export function OrderForm({
  deliveryMethods,
  entitySettings,
  legalEntities,
  skuCatalog,
  warehouses,
  paymentMethods,
  partialAmounts,
  paymentStatuses,
}: {
  deliveryMethods: DeliveryMethodRow[];
  entitySettings: DeliveryMethodEntitySettingsRow[];
  legalEntities: CompanyLegalEntityRow[];
  skuCatalog: ProductSkuCatalogItem[];
  warehouses: WarehouseRow[];
  paymentMethods: PaymentMethodRow[];
  partialAmounts: PaymentMethodPartialAmountRow[];
  paymentStatuses: PaymentStatusRow[];
}) {
  const primaryWarehouseId = warehouses.find((w) => w.isPrimary)?.id ?? warehouses[0]?.id ?? "";

  const [customer, setCustomer] = useState<OrderCustomerValues>(INITIAL_CUSTOMER);
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [warehouseId, setWarehouseId] = useState(primaryWarehouseId);
  const [itemsNote, setItemsNote] = useState("");
  const [payment, setPayment] = useState<OrderPaymentValues>({
    paymentMethodId: "",
    partialAmount: "",
    paymentStatusId: paymentStatuses[0]?.id ?? "",
  });
  const [delivery, setDelivery] = useState<OrderDeliveryValues>(INITIAL_DELIVERY);
  const [weightTouched, setWeightTouched] = useState(false);
  const [dimsTouched, setDimsTouched] = useState(false);
  const [parameters, setParameters] = useState<OrderParametersValues>({
    legalEntityId: legalEntities[0]?.id ?? "",
    notes: "",
    discountType: null,
    discountValue: "",
    promoCode: "",
  });
  const [schedule, setSchedule] = useState<OrderScheduleValues>({
    orderDate: formatTodayUa(),
    expectedShipmentDate: formatTodayUa(),
    status: "new",
    source: "website",
  });

  const [result, setResult] = useState<CreateOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patchDelivery(patch: Partial<OrderDeliveryValues>) {
    if ("weightKg" in patch) setWeightTouched(true);
    if ("packageLengthCm" in patch || "packageWidthCm" in patch || "packageHeightCm" in patch) setDimsTouched(true);
    setDelivery((prev) => ({ ...prev, ...patch }));
  }

  function handleItemsChange(next: OrderLineItem[]) {
    setItems(next);
    if (!weightTouched) {
      const totalWeight = next.reduce((sum, item) => sum + item.quantity * (item.packageWeightKg ?? 0), 0);
      setDelivery((prev) => ({ ...prev, weightKg: totalWeight > 0 ? totalWeight.toFixed(2) : prev.weightKg }));
    }
    if (!dimsTouched) {
      const dims = sumPackageDims(
        next.map((item) => ({
          length: item.packageLengthCm ?? 0,
          width: item.packageWidthCm ?? 0,
          height: item.packageHeightCm ?? 0,
        }))
      );
      if (dims) {
        setDelivery((prev) => ({
          ...prev,
          packageLengthCm: String(dims.length),
          packageWidthCm: String(dims.width),
          packageHeightCm: String(dims.height),
        }));
      }
    }
  }

  function patchPayment(patch: Partial<OrderPaymentValues>) {
    setPayment((prev) => ({ ...prev, ...patch }));
    if (patch.paymentMethodId) {
      const method = paymentMethods.find((m) => m.id === patch.paymentMethodId);
      setSchedule((prev) => ({ ...prev, status: method?.kind === "cash_on_delivery" ? "processing" : "new" }));
    }
  }

  const itemsTotal = orderLineItemsTotal(items);
  const afterOrderDiscount = applyDiscount(itemsTotal, parameters.discountType, parameters.discountValue);
  const deliveryCostNum = Number(delivery.deliveryCost) || 0;
  const grandTotal = afterOrderDiscount + deliveryCostNum;
  const selectedPaymentMethod = paymentMethods.find((m) => m.id === payment.paymentMethodId);
  const codAmount =
    selectedPaymentMethod?.kind === "cash_on_delivery"
      ? grandTotal
      : selectedPaymentMethod?.kind === "partial_payment"
        ? Math.max(0, grandTotal - (Number(payment.partialAmount) || 0))
        : 0;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const response = await createOrderAction({
        customerName: fullCustomerName(customer),
        customerPhone: customer.customerPhone,
        customerEmail: customer.customerEmail,
        customerComment: customer.customerComment,
        legalEntityId: parameters.legalEntityId,
        items: items.map((item) => ({
          productSkuId: item.productSkuId,
          productName: item.productName,
          sku: item.sku,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice) || 0,
          discountType: item.discountType,
          discountValue: item.discountValue ? Number(item.discountValue) : null,
        })),
        paymentMethodId: payment.paymentMethodId,
        paymentStatusId: payment.paymentStatusId,
        partialAmount: payment.partialAmount ? Number(payment.partialAmount) : null,
        source: schedule.source,
        notes: parameters.notes,
        itemsNote,
        orderDate: parseDateInputToIso(schedule.orderDate) ?? new Date().toISOString().slice(0, 10),
        expectedShipmentDate:
          parseDateInputToIso(schedule.expectedShipmentDate) ?? new Date().toISOString().slice(0, 10),
        discountType: parameters.discountType,
        discountValue: parameters.discountValue ? Number(parameters.discountValue) : null,
        promoCode: parameters.promoCode,
        warehouseId,
        usePackaging: delivery.usePackaging,
        packagingRef: delivery.packagingRef,
        packagingName: delivery.packagingName,
        weightKg: delivery.weightKg,
        packageLengthCm: delivery.packageLengthCm,
        packageWidthCm: delivery.packageWidthCm,
        packageHeightCm: delivery.packageHeightCm,
        seatsAmount: delivery.seatsAmount,
        declaredValue: delivery.declaredValue,
        deliveryCost: delivery.deliveryCost,
        deliveryMethodId: delivery.deliveryMethodId,
        npType: delivery.npType,
        recipientName: delivery.recipientIsDifferent ? delivery.recipientName : fullCustomerName(customer),
        recipientPhone: delivery.recipientIsDifferent ? delivery.recipientPhone : customer.customerPhone,
        recipientCityRef: delivery.recipientCityRef,
        recipientCity: delivery.recipientCity,
        recipientWarehouseRef: delivery.recipientWarehouseRef,
        recipientWarehouse: delivery.recipientWarehouse,
        recipientStreetRef: delivery.recipientStreetRef,
        recipientStreet: delivery.recipientStreet,
        recipientHouseNumber: delivery.recipientHouseNumber,
        shipmentTtn: delivery.shipment?.ttn ?? "",
        shipmentRef: delivery.shipment?.ref ?? "",
        shipmentCostOnSite: delivery.shipment?.costOnSite != null ? String(delivery.shipment.costOnSite) : "",
        shipmentEstimatedDeliveryDate: delivery.shipment?.estimatedDeliveryDate ?? "",
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
            setCustomer(INITIAL_CUSTOMER);
            setItems([]);
            setItemsNote("");
            setPayment({ paymentMethodId: "", partialAmount: "", paymentStatusId: paymentStatuses[0]?.id ?? "" });
            setDelivery(INITIAL_DELIVERY);
            setWeightTouched(false);
            setDimsTouched(false);
            setParameters({
              legalEntityId: legalEntities[0]?.id ?? "",
              notes: "",
              discountType: null,
              discountValue: "",
              promoCode: "",
            });
            setSchedule({ orderDate: formatTodayUa(), expectedShipmentDate: formatTodayUa(), status: "new", source: "website" });
            setResult(null);
          }}
        />
      </div>
    );
  }

  const canSubmit = items.length > 0 && Boolean(parameters.legalEntityId) && Boolean(payment.paymentStatusId) && !isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/orders" className="hover:text-foreground">
              Замовлення
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">Нове замовлення</span>
          </nav>
          <HeaderActions />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" render={<Link href="/orders" />} nativeButton={false} aria-label="Назад">
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Нове замовлення</h1>
            <Select
              value={parameters.legalEntityId}
              onValueChange={(v) => v && setParameters((prev) => ({ ...prev, legalEntityId: v }))}
            >
              <SelectTrigger size="sm" className="w-56">
                <SelectValue>
                  {() => legalEntities.find((e) => e.id === parameters.legalEntityId)?.name ?? "Оберіть ФОП/ТОВ"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {legalEntities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {legalEntities.length === 0 && (
              <p className="text-xs text-destructive">Немає активної юрособи — Налаштування → Загальні</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" render={<Link href="/orders" />} nativeButton={false}>
              Скасувати
            </Button>
            <StubHeaderButton label="Рахунок фактура" icon={Receipt} />
            <StubHeaderButton label="Друк замовлення" icon={FileText} />
            <StubHeaderButton label="Друк ТТН" icon={Printer} />
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Створити замовлення
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex flex-col gap-4 px-6 pb-6">
        {/* Ряд 1 — Клієнт 30% / Товари 70%, однакова висота (пряма вказівка людини) */}
        <div className="grid grid-cols-[3fr_7fr] items-stretch gap-4">
          <DevBlockLabel name="OrderCustomerCard" enabled={dev} stretch>
            <OrderCustomerCard values={customer} onChange={(patch) => setCustomer((prev) => ({ ...prev, ...patch }))} />
          </DevBlockLabel>
          <DevBlockLabel name="OrderItemsCard" enabled={dev} stretch>
            <OrderItemsCard
              items={items}
              catalog={skuCatalog}
              warehouses={warehouses}
              warehouseId={warehouseId}
              onWarehouseChange={setWarehouseId}
              itemsNote={itemsNote}
              onItemsNoteChange={setItemsNote}
              onChange={handleItemsChange}
            />
          </DevBlockLabel>
        </div>

        {/* Ряд 2 — Оплата (вузько) / Доставка (широко — четвертий прохід: вбирає
            простір, що звільнився після видалення OrderSummaryCard, пряма
            вказівка людини) */}
        <div className="grid grid-cols-[1fr_2fr] items-stretch gap-4">
          <DevBlockLabel name="OrderPaymentCard" enabled={dev} stretch>
            <OrderPaymentCard
              values={payment}
              onChange={patchPayment}
              paymentMethods={paymentMethods}
              partialAmounts={partialAmounts}
              paymentStatuses={paymentStatuses}
            />
          </DevBlockLabel>
          <DevBlockLabel name="OrderDeliveryCard" enabled={dev} stretch>
            <OrderDeliveryCard
              values={delivery}
              onChange={patchDelivery}
              deliveryMethods={deliveryMethods}
              entitySettings={entitySettings}
              legalEntityId={parameters.legalEntityId}
              customerName={fullCustomerName(customer)}
              customerPhone={customer.customerPhone}
              orderTotal={grandTotal}
              codAmount={codAmount}
              items={items.map((item) => ({ productName: item.productName, sku: item.sku, quantity: item.quantity }))}
              paymentMethodId={payment.paymentMethodId}
              partialAmount={payment.partialAmount ? Number(payment.partialAmount) : null}
            />
          </DevBlockLabel>
        </div>

        {/* Ряд 3 — Параметри замовлення (знижка/промокод/деталізована сума —
            четвертий прохід, перенесено з видаленого OrderSummaryCard) / Дати-статус-джерело */}
        <div className="grid grid-cols-[1fr_1fr] items-start gap-4">
          <DevBlockLabel name="OrderParametersCard" enabled={dev}>
            <OrderParametersCard
              values={parameters}
              onChange={(patch) => setParameters((prev) => ({ ...prev, ...patch }))}
              itemsTotal={itemsTotal}
              deliveryCost={deliveryCostNum}
              codCommission={selectedPaymentMethod?.kind === "cash_on_delivery" ? Number(delivery.codCommission) || 0 : 0}
            />
          </DevBlockLabel>
          <DevBlockLabel name="OrderScheduleCard" enabled={dev}>
            <OrderScheduleCard
              values={schedule}
              onChange={(patch) => setSchedule((prev) => ({ ...prev, ...patch }))}
            />
          </DevBlockLabel>
        </div>
      </div>
    </div>
  );
}
