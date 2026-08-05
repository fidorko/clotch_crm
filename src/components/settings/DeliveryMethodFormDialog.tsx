"use client";

import Image from "next/image";
import { useState, useTransition, type ReactElement } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeliveryMethodSenderFields } from "@/components/settings/DeliveryMethodSenderFields";
import {
  DeliveryMethodDescriptionFields,
  DeliveryMethodPayerFields,
} from "@/components/settings/DeliveryMethodShippingRulesFields";
import { DeliveryMethodAutomationFields, type StatusRuleDraft } from "@/components/settings/DeliveryMethodAutomationFields";
import { DeliveryMethodPackagingFields } from "@/components/settings/DeliveryMethodPackagingFields";
import type { DeliveryMethodRow, DeliveryMethodStatusRuleRow } from "@/server/data/delivery-methods";
import type { OrderStatusRow } from "@/server/data/order-statuses";
import type { CarrierCounterparty } from "@/server/carriers/carrier.interface";
import {
  createDeliveryMethodAction,
  testDeliveryApiKeyAction,
  updateDeliveryMethodAction,
  type DeliveryMethodFormInput,
} from "@/app/settings/delivery/actions";
import { listSenderCounterpartiesAction } from "@/app/settings/delivery/np-lookup-actions";
import { CARRIER_LOGOS, SYSTEM_CARRIER_KEYS } from "@/lib/constants/carrier-logos";

/** Обгортка-картка — візуальне розділення попапу на логічні блоки (пряма вказівка людини, 2026-08-06). */
function FormSection({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-lg border border-border bg-muted/20 p-4 ${className ?? ""}`}>{children}</div>;
}

function defaultsFrom(method: DeliveryMethodRow | undefined): DeliveryMethodFormInput {
  if (!method) {
    return {
      name: "",
      requiresApiKey: true,
      apiKey: "",
      isEnabled: false,
      senderCounterpartyRef: "",
      senderCounterparty: "",
      senderContactPersonRef: "",
      senderContactPerson: "",
      senderPhone: "",
      senderAddressType: "warehouse",
      senderCityRef: "",
      senderCity: "",
      senderWarehouseRef: "",
      senderAddressOrWarehouse: "",
      senderStreetRef: "",
      senderStreet: "",
      senderHouseNumber: "",
      payer: "recipient",
      declaredValueMode: "order_amount",
      declaredValueMinimum: "500",
      syncFrequencyMinutes: "",
      orderReturnOnRefusal: false,
      useCarrierPackaging: false,
      markingPrinterType: "regular",
      descriptionContent: "product_names",
      descriptionIncludeQuantity: true,
      statusRules: [],
    };
  }
  return {
    name: method.name,
    requiresApiKey: method.requiresApiKey,
    apiKey: method.apiKey ?? "",
    isEnabled: method.isEnabled,
    senderCounterpartyRef: method.senderCounterpartyRef ?? "",
    senderCounterparty: method.senderCounterparty ?? "",
    senderContactPersonRef: method.senderContactPersonRef ?? "",
    senderContactPerson: method.senderContactPerson ?? "",
    senderPhone: method.senderPhone ?? "",
    senderAddressType: method.senderAddressType,
    senderCityRef: method.senderCityRef ?? "",
    senderCity: method.senderCity ?? "",
    senderWarehouseRef: method.senderWarehouseRef ?? "",
    senderAddressOrWarehouse: method.senderAddressOrWarehouse ?? "",
    senderStreetRef: method.senderStreetRef ?? "",
    senderStreet: method.senderStreet ?? "",
    senderHouseNumber: method.senderHouseNumber ?? "",
    payer: method.payer,
    declaredValueMode: method.declaredValueMode,
    declaredValueMinimum: method.declaredValueMinimum ?? "",
    syncFrequencyMinutes: method.syncFrequencyMinutes?.toString() ?? "",
    orderReturnOnRefusal: method.orderReturnOnRefusal,
    useCarrierPackaging: method.useCarrierPackaging,
    markingPrinterType: method.markingPrinterType,
    descriptionContent: method.descriptionContent,
    descriptionIncludeQuantity: method.descriptionIncludeQuantity,
    statusRules: [],
  };
}

function draftsFrom(rules: DeliveryMethodStatusRuleRow[]): StatusRuleDraft[] {
  return rules.map((r) => ({ key: r.id, carrierStatus: r.carrierStatus, orderStatusId: r.orderStatusId }));
}

export function DeliveryMethodFormDialog({
  trigger,
  method,
  statusRules = [],
  orderStatuses,
  onSaved,
}: {
  trigger: ReactElement;
  method?: DeliveryMethodRow;
  statusRules?: DeliveryMethodStatusRuleRow[];
  orderStatuses: OrderStatusRow[];
  onSaved: () => void;
}) {
  const isEdit = Boolean(method);
  const isNovaPoshta = method?.carrierKey === "nova_poshta";
  const isSystemCarrier = Boolean(method && SYSTEM_CARRIER_KEYS.includes(method.carrierKey));
  const logo = method ? CARRIER_LOGOS[method.carrierKey] : undefined;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DeliveryMethodFormInput>(() => defaultsFrom(method));
  const [rules, setRules] = useState<StatusRuleDraft[]>(() => draftsFrom(statusRules));
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isTesting, startTesting] = useTransition();
  const [senderCounterparties, setSenderCounterparties] = useState<CarrierCounterparty[]>([]);
  const [npDataError, setNpDataError] = useState<string | null>(null);

  function setField<K extends keyof DeliveryMethodFormInput>(field: K, value: DeliveryMethodFormInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      const initial = defaultsFrom(method);
      setForm(initial);
      setRules(draftsFrom(statusRules));
      setError(null);
      setTestResult(null);
      setNpDataError(null);
      setSenderCounterparties([]);
      if (isNovaPoshta && initial.apiKey) {
        listSenderCounterpartiesAction(initial.apiKey).then((result) => {
          if (result.ok) setSenderCounterparties(result.items);
          else setNpDataError(result.message);
        });
      }
    }
  }

  function handleTestConnection() {
    setTestResult(null);
    startTesting(async () => {
      const result = await testDeliveryApiKeyAction(method?.carrierKey ?? "", form.apiKey);
      setTestResult(result);
    });
  }

  function handleSave() {
    setError(null);
    const input: DeliveryMethodFormInput = {
      ...form,
      statusRules: rules.map((r) => ({ carrierStatus: r.carrierStatus, orderStatusId: r.orderStatusId })),
    };
    startSaving(async () => {
      try {
        if (isEdit && method) {
          await updateDeliveryMethodAction(method.id, input);
        } else {
          await createDeliveryMethodAction(input);
        }
        setOpen(false);
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти спосіб доставки");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {logo && (
              <Image src={logo} alt="" width={24} height={24} className="rounded object-contain" unoptimized />
            )}
            {isEdit ? "Редагувати спосіб доставки" : "Додати спосіб доставки"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Зміни зберігаються одразу для всього тенанта."
              : "Новий спосіб доставки з'явиться в списку нижче."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FormSection>
            <h3 className="text-sm font-semibold text-foreground">Дані API</h3>
            <div className="mt-3 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="delivery-method-name">
                Назва *
              </label>
              <Input
                id="delivery-method-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Наприклад, Нова Пошта"
                autoFocus={!isSystemCarrier}
                disabled={isSystemCarrier}
                className="sm:w-1/2"
              />
              {isSystemCarrier && (
                <p className="text-xs text-muted-foreground">Системний спосіб доставки — назва не редагується.</p>
              )}
            </div>

            {form.requiresApiKey && (
              <div className="mt-3 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="delivery-method-api-key">
                  API Key
                </label>
                <div className="flex items-center gap-2 sm:w-2/3">
                  <Input
                    id="delivery-method-api-key"
                    value={form.apiKey}
                    onChange={(e) => setField("apiKey", e.target.value)}
                    placeholder="Ключ з особистого кабінету перевізника"
                    type="password"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                    Перевірити підключення
                  </Button>
                </div>
                {testResult && (
                  <p className={testResult.ok ? "text-sm text-success" : "text-sm text-destructive"}>
                    {testResult.message}
                  </p>
                )}
              </div>
            )}
          </FormSection>

          {form.requiresApiKey && (
            <>
              <FormSection>
                <DeliveryMethodSenderFields
                  form={form}
                  setField={setField}
                  isNovaPoshta={isNovaPoshta}
                  senderCounterparties={senderCounterparties}
                />
              </FormSection>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSection>
                  <DeliveryMethodPayerFields form={form} setField={setField} />
                </FormSection>
                <FormSection className="flex flex-col gap-4">
                  <DeliveryMethodPackagingFields form={form} setField={setField} />
                </FormSection>
              </div>

              <FormSection>
                <DeliveryMethodDescriptionFields form={form} setField={setField} />
              </FormSection>

              <FormSection>
                <DeliveryMethodAutomationFields
                  form={form}
                  setField={setField}
                  statusRules={rules}
                  onStatusRulesChange={setRules}
                  orderStatuses={orderStatuses}
                />
              </FormSection>
            </>
          )}

          {npDataError && (
            <p className="text-sm text-destructive">Не вдалося завантажити довідники Нової пошти: {npDataError}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
