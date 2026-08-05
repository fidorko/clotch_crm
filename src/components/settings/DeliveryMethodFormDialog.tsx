"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DeliveryMethodSenderFields } from "@/components/settings/DeliveryMethodSenderFields";
import { DeliveryMethodShippingRulesFields } from "@/components/settings/DeliveryMethodShippingRulesFields";
import { DeliveryMethodAutomationFields, type StatusRuleDraft } from "@/components/settings/DeliveryMethodAutomationFields";
import { DeliveryMethodPackagingFields } from "@/components/settings/DeliveryMethodPackagingFields";
import type { DeliveryMethodRow, DeliveryMethodStatusRuleRow } from "@/server/data/delivery-methods";
import type { OrderStatusRow } from "@/server/data/order-statuses";
import type { NpCounterparty, NpPackItem } from "@/server/integrations/nova-poshta";
import {
  createDeliveryMethodAction,
  testDeliveryApiKeyAction,
  updateDeliveryMethodAction,
  type DeliveryMethodFormInput,
} from "@/app/settings/delivery/actions";
import { listPackListAction, listSenderCounterpartiesAction } from "@/app/settings/delivery/np-lookup-actions";
import { NOVA_POSHTA_SERVICE_TYPES } from "@/lib/constants/nova-poshta";

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
      senderCityRef: "",
      senderCity: "",
      senderWarehouseRef: "",
      senderAddressOrWarehouse: "",
      allowedServiceTypes: NOVA_POSHTA_SERVICE_TYPES.map((t) => t.ref),
      payer: "recipient",
      declaredValueMode: "order_amount",
      declaredValueMinimum: "500",
      syncFrequencyMinutes: "",
      orderReturnOnRefusal: false,
      packaging: "none",
      packRef: "",
      packDescription: "",
      labelFormat: "",
      waybillFormat: "",
      printerName: "",
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
    senderCityRef: method.senderCityRef ?? "",
    senderCity: method.senderCity ?? "",
    senderWarehouseRef: method.senderWarehouseRef ?? "",
    senderAddressOrWarehouse: method.senderAddressOrWarehouse ?? "",
    allowedServiceTypes: method.allowedServiceTypes,
    payer: method.payer,
    declaredValueMode: method.declaredValueMode,
    declaredValueMinimum: method.declaredValueMinimum ?? "",
    syncFrequencyMinutes: method.syncFrequencyMinutes?.toString() ?? "",
    orderReturnOnRefusal: method.orderReturnOnRefusal,
    packaging: method.packaging,
    packRef: method.packRef ?? "",
    packDescription: method.packDescription ?? "",
    labelFormat: method.labelFormat ?? "",
    waybillFormat: method.waybillFormat ?? "",
    printerName: method.printerName ?? "",
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DeliveryMethodFormInput>(() => defaultsFrom(method));
  const [rules, setRules] = useState<StatusRuleDraft[]>(() => draftsFrom(statusRules));
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isTesting, startTesting] = useTransition();
  const [senderCounterparties, setSenderCounterparties] = useState<NpCounterparty[]>([]);
  const [packList, setPackList] = useState<NpPackItem[]>([]);
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
      setPackList([]);
      if (isNovaPoshta && initial.apiKey) {
        Promise.all([
          listSenderCounterpartiesAction(initial.apiKey),
          listPackListAction(initial.apiKey),
        ]).then(([counterpartiesResult, packListResult]) => {
          if (counterpartiesResult.ok) setSenderCounterparties(counterpartiesResult.items);
          else setNpDataError(counterpartiesResult.message);
          if (packListResult.ok) setPackList(packListResult.items);
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редагувати спосіб доставки" : "Додати спосіб доставки"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Зміни зберігаються одразу для всього тенанта."
              : "Новий спосіб доставки з'явиться в списку нижче."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Дані API</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="delivery-method-name">
                Назва *
              </label>
              <Input
                id="delivery-method-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Наприклад, Нова Пошта"
                autoFocus
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={form.requiresApiKey}
                onCheckedChange={(v) => setField("requiresApiKey", v === true)}
              />
              Потребує API-ключ перевізника
            </label>

            {form.requiresApiKey && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="delivery-method-api-key">
                    API Key
                  </label>
                  <div className="flex items-center gap-2">
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
              </>
            )}

            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={form.isEnabled} onCheckedChange={(v) => setField("isEnabled", v === true)} />
              Увімкнено
            </label>
          </div>

          {form.requiresApiKey && (
            <>
              <DeliveryMethodSenderFields
                form={form}
                setField={setField}
                isNovaPoshta={isNovaPoshta}
                senderCounterparties={senderCounterparties}
              />
              <DeliveryMethodShippingRulesFields form={form} setField={setField} />
              <DeliveryMethodAutomationFields
                form={form}
                setField={setField}
                statusRules={rules}
                onStatusRulesChange={setRules}
                orderStatuses={orderStatuses}
              />
              <DeliveryMethodPackagingFields
                form={form}
                setField={setField}
                isNovaPoshta={isNovaPoshta}
                packList={packList}
              />
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
