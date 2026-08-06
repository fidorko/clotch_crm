"use client";

import { useState, useTransition } from "react";
import { Calculator, Loader2, Package, Printer, Trash2, Truck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NpSearchCombobox } from "@/components/carriers/NpSearchCombobox";
import {
  listPackListAction,
  searchDeliveryCitiesAction,
  searchDeliveryStreetsAction,
  searchDeliveryWarehousesAction,
} from "@/app/settings/delivery/np-lookup-actions";
import {
  calculateDeliveryCostAction,
  createShipmentNowAction,
  deleteShipmentNowAction,
  printShipmentNowAction,
  trackShipmentAction,
} from "@/app/orders/new/actions";
import { buildShipmentDescription } from "@/lib/orders/shipment-description";
import type { DeliveryMethodRow } from "@/server/data/delivery-methods";
import type { DeliveryMethodEntitySettingsRow } from "@/server/data/delivery-method-entity-settings";
import type { NovaPoshtaPackItem } from "@/server/carriers/novaposhta/mapper";
import { formatOrderSum } from "@/lib/types/orders";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

type NpDeliveryType = "warehouse" | "postomat" | "address";

// ЕН, реально створена по кліку «Створити ЕН» (четвертий прохід — не при
// сабміті замовлення, одразу). null — ще не створено.
export interface OrderShipmentInfo {
  ttn: string;
  ref: string;
  costOnSite: number | null;
  estimatedDeliveryDate: string | null;
  statusText: string | null;
}

export interface OrderDeliveryValues {
  deliveryMethodId: string;
  npType: NpDeliveryType;
  recipientIsDifferent: boolean;
  recipientName: string;
  recipientPhone: string;
  recipientCityRef: string;
  recipientCity: string;
  recipientWarehouseRef: string;
  recipientWarehouse: string;
  recipientStreetRef: string;
  recipientStreet: string;
  recipientHouseNumber: string;
  weightKg: string;
  packageLengthCm: string;
  packageWidthCm: string;
  packageHeightCm: string;
  seatsAmount: string;
  declaredValue: string;
  usePackaging: boolean;
  packagingRef: string;
  packagingName: string;
  deliveryCost: string;
  // Комісія накладеного платежу (getDocumentPrice.CostRedelivery) — лише для
  // показу в деталізації «До оплати клієнтом» (OrderParametersCard), не
  // впливає на саму codAmount.
  codCommission: string;
  shipment: OrderShipmentInfo | null;
}

function IconAction({
  icon: Icon,
  label,
  pressed,
  disabled,
  loading,
  colorClass,
  onClick,
}: {
  icon: typeof Truck;
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  loading?: boolean;
  colorClass: string;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={pressed}
            className={`flex size-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              pressed ? colorClass : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          />
        }
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Доставка — вибір реального способу тенанта. Для Нової пошти — реальний
 * пошук міста/відділення/поштомата/вулиці, реальний розрахунок вартості,
 * і (четвертий прохід, пряма вказівка людини) РЕАЛЬНЕ створення ЕН одразу по
 * кліку — не при сабміті замовлення. Поки ЕН існує — поля отримувача/ваги/
 * габаритів/пакування заблоковані (щоб форма не розійшлась із реально
 * створеним відправленням); «Видалити ЕН» знімає блокування.
 */
export function OrderDeliveryCard({
  values,
  onChange,
  deliveryMethods,
  entitySettings,
  legalEntityId,
  customerName,
  customerPhone,
  orderTotal,
  codAmount,
  items,
  paymentMethodId,
  partialAmount,
}: {
  values: OrderDeliveryValues;
  onChange: (patch: Partial<OrderDeliveryValues>) => void;
  deliveryMethods: DeliveryMethodRow[];
  entitySettings: DeliveryMethodEntitySettingsRow[];
  legalEntityId: string;
  customerName: string;
  customerPhone: string;
  orderTotal: number;
  codAmount: number;
  items: { productName: string; sku: string; quantity: number }[];
  // codAmount вище — вже порахований клієнтом (для показу); сервер рахує
  // САМ, незалежно, з цих двох полів (§6 CLAUDE.md — не довіряти клієнту,
  // особливо тут: реальний грошовий переказ на акаунті тенанта).
  paymentMethodId: string;
  partialAmount: number | null;
}) {
  const [calcError, setCalcError] = useState<string | null>(null);
  const [isCalculating, startCalculating] = useTransition();
  const [packOptions, setPackOptions] = useState<NovaPoshtaPackItem[] | null>(null);
  const [isLoadingPack, startLoadingPack] = useTransition();
  const [shipmentError, setShipmentError] = useState<string | null>(null);
  const [isCreatingShipment, startCreatingShipment] = useTransition();
  const [isDeletingShipment, startDeletingShipment] = useTransition();
  const [printError, setPrintError] = useState<string | null>(null);
  const [isPrinting, startPrinting] = useTransition();

  const locked = Boolean(values.shipment);
  const selected = deliveryMethods.find((m) => m.id === values.deliveryMethodId) ?? null;
  const selectedEntitySettings = selected
    ? entitySettings.find((s) => s.deliveryMethodId === selected.id && s.legalEntityId === legalEntityId)
    : undefined;
  const isNovaPoshta = selected?.carrierKey === "nova_poshta";
  const senderReady = Boolean(
    selectedEntitySettings?.senderCounterpartyRef &&
      selectedEntitySettings?.senderContactPersonRef &&
      selectedEntitySettings?.senderWarehouseRef
  );
  const recipientName = values.recipientIsDifferent ? values.recipientName : customerName;
  const recipientPhone = values.recipientIsDifferent ? values.recipientPhone : customerPhone;
  // .slice(0, 36) — той самий ліміт, що реально піде в НП (Description —
  // string[36], четвертий прохід: довший текст НП мовчки ігнорує ЦІЛЕ поле,
  // не обрізає — прев'ю мусить показувати те саме, що реально відправиться.
  const descriptionPreview = selectedEntitySettings
    ? buildShipmentDescription(
        selectedEntitySettings.descriptionContent,
        selectedEntitySettings.descriptionIncludeQuantity,
        items,
        null
      ).slice(0, 36)
    : "";

  function handleMethodChange(id: string) {
    onChange({
      deliveryMethodId: id,
      recipientCityRef: "",
      recipientCity: "",
      recipientWarehouseRef: "",
      recipientWarehouse: "",
      recipientStreetRef: "",
      recipientStreet: "",
      recipientHouseNumber: "",
      declaredValue: orderTotal.toFixed(2),
      deliveryCost: "",
      codCommission: "",
    });
  }

  function handleNpTypeChange(npType: NpDeliveryType) {
    onChange({
      npType,
      recipientWarehouseRef: "",
      recipientWarehouse: "",
      recipientStreetRef: "",
      recipientStreet: "",
      recipientHouseNumber: "",
      deliveryCost: "",
      codCommission: "",
    });
  }

  function handleCityChange(item: { ref: string; name: string }) {
    onChange({
      recipientCityRef: item.ref,
      recipientCity: item.name,
      recipientWarehouseRef: "",
      recipientWarehouse: "",
      recipientStreetRef: "",
      recipientStreet: "",
    });
  }

  function handleCalculate() {
    setCalcError(null);
    startCalculating(async () => {
      const result = await calculateDeliveryCostAction({
        deliveryMethodId: values.deliveryMethodId,
        legalEntityId,
        npType: values.npType,
        cityToRef: values.recipientCityRef,
        weightKg: values.weightKg,
        declaredValue: values.declaredValue || String(orderTotal),
        seatsAmount: values.seatsAmount,
        packagingRef: values.packagingRef,
      });
      if (!result.ok) {
        setCalcError(result.message);
        return;
      }
      onChange({
        deliveryCost: result.result.cost.toFixed(2),
        codCommission: result.result.costRedelivery ? result.result.costRedelivery.toFixed(2) : "",
      });
    });
  }

  function openPackagingMenu(open: boolean) {
    if (!open || packOptions !== null || !selectedEntitySettings?.apiKey) return;
    startLoadingPack(async () => {
      const result = await listPackListAction(selectedEntitySettings.apiKey ?? "");
      setPackOptions(result.ok ? result.items : []);
    });
  }

  function choosePackaging(pack: NovaPoshtaPackItem | null) {
    onChange({
      usePackaging: pack !== null,
      packagingRef: pack?.ref ?? "",
      packagingName: pack?.name ?? "",
      deliveryCost: "",
      codCommission: "",
    });
  }

  function handleCreateShipment() {
    setShipmentError(null);
    startCreatingShipment(async () => {
      const result = await createShipmentNowAction({
        deliveryMethodId: values.deliveryMethodId,
        legalEntityId,
        npType: values.npType,
        weightKg: values.weightKg,
        packageLengthCm: values.packageLengthCm,
        packageWidthCm: values.packageWidthCm,
        packageHeightCm: values.packageHeightCm,
        seatsAmount: values.seatsAmount,
        declaredValue: values.declaredValue || String(orderTotal),
        recipientName,
        recipientPhone,
        recipientCityRef: values.recipientCityRef,
        recipientCity: values.recipientCity,
        recipientWarehouseRef: values.recipientWarehouseRef,
        recipientStreetRef: values.recipientStreetRef,
        recipientHouseNumber: values.recipientHouseNumber,
        items,
        paymentMethodId,
        partialAmount,
        grandTotal: orderTotal,
      });
      if (!result.ok) {
        setShipmentError(result.message);
        return;
      }
      // Вартість доставки (пункт 4, четвертий прохід) — беремо реальну з
      // відповіді createShipment, не лишаємо орієнтовну з калькулятора.
      onChange({
        shipment: {
          ttn: result.shipment.documentNumber,
          ref: result.shipment.ref,
          costOnSite: result.shipment.costOnSite,
          estimatedDeliveryDate: result.shipment.estimatedDeliveryDate,
          statusText: null,
        },
        deliveryCost:
          result.shipment.costOnSite !== null ? result.shipment.costOnSite.toFixed(2) : values.deliveryCost,
        codCommission: "",
      });
      // Статус — окремий тихий виклик одразу після створення (пункт 10), не
      // блокує показ номера ЕН, якщо трекінг ще не встиг проіндексувати.
      const trackResult = await trackShipmentAction(result.shipment.documentNumber, values.deliveryMethodId, legalEntityId);
      if (trackResult.ok) {
        onChange({
          shipment: {
            ttn: result.shipment.documentNumber,
            ref: result.shipment.ref,
            costOnSite: result.shipment.costOnSite,
            estimatedDeliveryDate: result.shipment.estimatedDeliveryDate,
            statusText: trackResult.result.status,
          },
        });
      }
    });
  }

  function handleDeleteShipment() {
    if (!values.shipment) return;
    setShipmentError(null);
    startDeletingShipment(async () => {
      const result = await deleteShipmentNowAction(values.shipment!.ref, values.deliveryMethodId, legalEntityId);
      if (!result.ok) {
        setShipmentError(result.message);
        return;
      }
      onChange({ shipment: null, deliveryCost: "", codCommission: "" });
    });
  }

  // Друк маркування — доступний одразу після створення ЕН (пряма вказівка
  // людини), не лише після збереження замовлення: ref уже реальний.
  function handlePrintMarking() {
    if (!values.shipment) return;
    setPrintError(null);
    startPrinting(async () => {
      const result = await printShipmentNowAction(values.shipment!.ref, "marking", values.deliveryMethodId, legalEntityId);
      if (!result.ok) {
        setPrintError(result.message);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <Card className="h-full gap-3 p-4">
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Доставка</span>

        <RadioGroup
          value={values.deliveryMethodId}
          onValueChange={(v) => v && handleMethodChange(v)}
          className="grid-flow-col justify-start gap-4"
        >
          {deliveryMethods.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm text-foreground">
              <RadioGroupItem value={m.id} disabled={locked} />
              {m.name}
            </label>
          ))}
        </RadioGroup>

        {selected && !isNovaPoshta && (
          <p className="text-xs text-muted-foreground">
            Реальне створення ЕН підключено поки лише для Нової пошти — для «{selected.name}» доставку фіксуємо
            лише в замовленні, без виклику API.
          </p>
        )}

        {isNovaPoshta && !senderReady && (
          <p className="text-xs text-destructive">
            У способу доставки «{selected.name}» не заповнено відправника для обраної юрособи — settings → Доставка.
          </p>
        )}

        {isNovaPoshta && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <RadioGroup
              value={values.npType}
              onValueChange={(v) => v && handleNpTypeChange(v as NpDeliveryType)}
              className="col-span-2 grid-flow-col justify-start gap-4"
            >
              <label className="flex items-center gap-1.5 text-sm text-foreground">
                <RadioGroupItem value="warehouse" disabled={locked} />
                Відділення
              </label>
              <label className="flex items-center gap-1.5 text-sm text-foreground">
                <RadioGroupItem value="postomat" disabled={locked} />
                Поштомат
              </label>
              <label className="flex items-center gap-1.5 text-sm text-foreground">
                <RadioGroupItem value="address" disabled={locked} />
                Адреса
              </label>
            </RadioGroup>

            <label className="col-span-2 flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={values.recipientIsDifferent}
                disabled={locked}
                onCheckedChange={(checked) => onChange({ recipientIsDifferent: checked === true })}
              />
              Інший отримувач
            </label>

            {values.recipientIsDifferent && (
              <>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Ім&apos;я отримувача (ПІБ)</FieldLabel>
                  <Input
                    value={values.recipientName}
                    disabled={locked}
                    onChange={(e) => onChange({ recipientName: e.target.value })}
                    placeholder="Прізвище Ім'я По батькові"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Телефон отримувача</FieldLabel>
                  <PhoneInput value={values.recipientPhone} disabled={locked} onChange={(v) => onChange({ recipientPhone: v })} />
                </div>
              </>
            )}
            {!values.recipientIsDifferent && (
              <p className="col-span-2 text-xs text-muted-foreground">
                Отримувач: {recipientName || "—"}{recipientPhone ? `, ${recipientPhone}` : ""}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Місто</FieldLabel>
              <NpSearchCombobox
                selectedLabel={values.recipientCity}
                placeholder="Пошук міста..."
                disabled={locked}
                onSearch={(query) => searchDeliveryCitiesAction(selectedEntitySettings?.apiKey ?? "", query)}
                onSelect={handleCityChange}
              />
            </div>

            {values.npType !== "address" && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel>{values.npType === "postomat" ? "Поштомат" : "Відділення"}</FieldLabel>
                <NpSearchCombobox
                  selectedLabel={values.recipientWarehouse}
                  placeholder={values.recipientCityRef ? "Пошук..." : "Спершу оберіть місто"}
                  disabled={locked || !values.recipientCityRef}
                  onSearch={(query) =>
                    searchDeliveryWarehousesAction(
                      selectedEntitySettings?.apiKey ?? "",
                      values.recipientCityRef,
                      query,
                      values.npType as "warehouse" | "postomat"
                    )
                  }
                  onSelect={(item) => onChange({ recipientWarehouseRef: item.ref, recipientWarehouse: item.name })}
                />
              </div>
            )}

            {values.npType === "address" && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Вулиця</FieldLabel>
                <NpSearchCombobox
                  selectedLabel={values.recipientStreet}
                  placeholder={values.recipientCityRef ? "Пошук вулиці..." : "Спершу оберіть місто"}
                  disabled={locked || !values.recipientCityRef}
                  onSearch={(query) =>
                    searchDeliveryStreetsAction(selectedEntitySettings?.apiKey ?? "", values.recipientCityRef, query)
                  }
                  onSelect={(item) => onChange({ recipientStreetRef: item.ref, recipientStreet: item.name })}
                />
              </div>
            )}

            {values.npType === "address" && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Номер будинку</FieldLabel>
                <Input
                  value={values.recipientHouseNumber}
                  disabled={locked}
                  onChange={(e) => onChange({ recipientHouseNumber: e.target.value })}
                  placeholder="Напр. 12А"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Вага, кг</FieldLabel>
              <DecimalInput value={values.weightKg} disabled={locked} onChange={(v) => onChange({ weightKg: v })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Д×Ш×В, см</FieldLabel>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  disabled={locked}
                  value={values.packageLengthCm}
                  onChange={(e) => onChange({ packageLengthCm: e.target.value })}
                  className="h-8 w-full text-right"
                />
                <Input
                  type="number"
                  min={0}
                  disabled={locked}
                  value={values.packageWidthCm}
                  onChange={(e) => onChange({ packageWidthCm: e.target.value })}
                  className="h-8 w-full text-right"
                />
                <Input
                  type="number"
                  min={0}
                  disabled={locked}
                  value={values.packageHeightCm}
                  onChange={(e) => onChange({ packageHeightCm: e.target.value })}
                  className="h-8 w-full text-right"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Місць</FieldLabel>
              <Input
                type="number"
                min={1}
                disabled={locked}
                value={values.seatsAmount}
                onChange={(e) => onChange({ seatsAmount: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Оголош. вартість, грн</FieldLabel>
              <DecimalInput value={values.declaredValue} disabled={locked} onChange={(v) => onChange({ declaredValue: v })} />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <FieldLabel>Опис вантажу (у ЕН, до 36 символів — обмеження Нової пошти)</FieldLabel>
              <p className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
                {descriptionPreview || "—"}
              </p>
            </div>

            {codAmount > 0 && (
              <p className="col-span-2 text-xs text-foreground">
                Сума післяплати: <span className="font-semibold">{formatOrderSum(codAmount)}</span>
              </p>
            )}

            {values.shipment && (
              <div className="col-span-2 flex flex-col gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">ЕН № {values.shipment.ttn}</span>
                  {values.shipment.costOnSite !== null && (
                    <span className="text-sm text-foreground">{formatOrderSum(values.shipment.costOnSite)}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {values.shipment.statusText ?? "Статус ще не отримано"}
                </span>
              </div>
            )}
            {shipmentError && <p className="col-span-2 text-xs text-destructive">{shipmentError}</p>}
            {printError && <p className="col-span-2 text-xs text-destructive">{printError}</p>}

            <div className="col-span-2 flex items-center gap-2 border-t border-border pt-3">
              {selectedEntitySettings?.useCarrierPackaging && (
                <DropdownMenu onOpenChange={openPackagingMenu}>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        disabled={locked}
                        title={values.packagingName || "Обрати пакування"}
                        aria-pressed={values.usePackaging}
                        className={`flex size-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          values.usePackaging
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      />
                    }
                  >
                    <Package className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => choosePackaging(null)}>Без пакування</DropdownMenuItem>
                    {isLoadingPack && <DropdownMenuItem disabled>Завантаження...</DropdownMenuItem>}
                    {packOptions?.map((pack) => (
                      <DropdownMenuItem key={pack.ref} onClick={() => choosePackaging(pack)}>
                        {pack.name}
                      </DropdownMenuItem>
                    ))}
                    {packOptions?.length === 0 && !isLoadingPack && (
                      <DropdownMenuItem disabled>Порожньо</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {values.usePackaging && values.packagingName && (
                <span className="text-xs text-muted-foreground">{values.packagingName}</span>
              )}
              <IconAction
                icon={Calculator}
                label="Розрахувати вартість доставки"
                disabled={locked || !senderReady || !values.recipientCityRef || isCalculating}
                loading={isCalculating}
                colorClass="bg-blue-500/15 text-blue-600 dark:text-blue-400"
                onClick={handleCalculate}
              />
              {!values.shipment ? (
                <IconAction
                  icon={Truck}
                  label="Створити ЕН"
                  disabled={!senderReady || !values.recipientCityRef || isCreatingShipment}
                  loading={isCreatingShipment}
                  colorClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  onClick={handleCreateShipment}
                />
              ) : (
                <IconAction
                  icon={Trash2}
                  label="Видалити ЕН"
                  pressed
                  disabled={isDeletingShipment}
                  loading={isDeletingShipment}
                  colorClass="bg-destructive/15 text-destructive"
                  onClick={handleDeleteShipment}
                />
              )}
              <IconAction
                icon={Printer}
                label={values.shipment ? "Друк маркування" : "Друк маркування стане доступним після створення ЕН"}
                disabled={!values.shipment || isPrinting}
                loading={isPrinting}
                colorClass="bg-blue-500/15 text-blue-600 dark:text-blue-400"
                onClick={handlePrintMarking}
              />
              {values.deliveryCost && (
                <span className="ml-auto text-sm text-foreground">
                  Вартість: <span className="font-semibold">{formatOrderSum(Number(values.deliveryCost))}</span>
                </span>
              )}
            </div>
            {calcError && <p className="col-span-2 text-xs text-destructive">{calcError}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
