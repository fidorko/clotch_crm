"use client";

import Image from "next/image";
import { useRef, useState, useTransition, type ReactElement } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeliveryMethodSenderFields } from "@/components/settings/DeliveryMethodSenderFields";
import {
  DeliveryMethodDescriptionFields,
  DeliveryMethodPayerFields,
} from "@/components/settings/DeliveryMethodShippingRulesFields";
import { DeliveryMethodAutomationFields, type StatusRuleDraft } from "@/components/settings/DeliveryMethodAutomationFields";
import { DeliveryMethodPackagingFields } from "@/components/settings/DeliveryMethodPackagingFields";
import type { DeliveryMethodRow } from "@/server/data/delivery-methods";
import type {
  DeliveryMethodEntitySettingsRow,
  DeliveryMethodStatusRuleRow,
} from "@/server/data/delivery-method-entity-settings";
import type { CompanyLegalEntityRow } from "@/server/data/company-legal-entities";
import type { OrderStatusRow } from "@/server/data/order-statuses";
import type { CarrierCounterparty } from "@/server/carriers/carrier.interface";
import type { NovaPoshtaContactPerson } from "@/server/carriers/novaposhta/mapper";
import {
  createDeliveryMethodAction,
  saveDeliveryMethodEntitySettingsAction,
  testDeliveryApiKeyAction,
  updateDeliveryMethodAction,
  type DeliveryMethodEntitySettingsFormInput,
  type DeliveryMethodFormInput,
} from "@/app/settings/delivery/actions";
import { listContactPersonsAction, listSenderCounterpartiesAction } from "@/app/settings/delivery/np-lookup-actions";
import { CARRIER_LOGOS, SYSTEM_CARRIER_KEYS } from "@/lib/constants/carrier-logos";

/** Обгортка-картка — візуальне розділення попапу на логічні блоки (пряма вказівка людини, 2026-08-06). */
function FormSection({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-lg border border-border bg-muted/20 p-4 ${className ?? ""}`}>{children}</div>;
}

function methodDefaultsFrom(method: DeliveryMethodRow | undefined): DeliveryMethodFormInput {
  if (!method) return { name: "", requiresApiKey: true, isEnabled: false };
  return { name: method.name, requiresApiKey: method.requiresApiKey, isEnabled: method.isEnabled };
}

function entitySettingsDefaults(): DeliveryMethodEntitySettingsFormInput {
  return {
    apiKey: "",
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
    syncFrequencyMinutes: "1",
    orderReturnOnRefusal: false,
    useCarrierPackaging: false,
    markingPrinterType: "regular",
    descriptionContent: "product_names",
    descriptionIncludeQuantity: true,
    statusRules: [],
  };
}

function entitySettingsFrom(row: DeliveryMethodEntitySettingsRow | undefined): DeliveryMethodEntitySettingsFormInput {
  if (!row) return entitySettingsDefaults();
  return {
    apiKey: row.apiKey ?? "",
    senderCounterpartyRef: row.senderCounterpartyRef ?? "",
    senderCounterparty: row.senderCounterparty ?? "",
    senderContactPersonRef: row.senderContactPersonRef ?? "",
    senderContactPerson: row.senderContactPerson ?? "",
    senderPhone: row.senderPhone ?? "",
    senderAddressType: row.senderAddressType,
    senderCityRef: row.senderCityRef ?? "",
    senderCity: row.senderCity ?? "",
    senderWarehouseRef: row.senderWarehouseRef ?? "",
    senderAddressOrWarehouse: row.senderAddressOrWarehouse ?? "",
    senderStreetRef: row.senderStreetRef ?? "",
    senderStreet: row.senderStreet ?? "",
    senderHouseNumber: row.senderHouseNumber ?? "",
    payer: row.payer,
    declaredValueMode: row.declaredValueMode,
    declaredValueMinimum: row.declaredValueMinimum ?? "",
    syncFrequencyMinutes: row.syncFrequencyMinutes?.toString() ?? "1",
    orderReturnOnRefusal: row.orderReturnOnRefusal,
    useCarrierPackaging: row.useCarrierPackaging,
    markingPrinterType: row.markingPrinterType,
    descriptionContent: row.descriptionContent,
    descriptionIncludeQuantity: row.descriptionIncludeQuantity,
    statusRules: [],
  };
}

function draftsFrom(rules: DeliveryMethodStatusRuleRow[]): StatusRuleDraft[] {
  return rules.map((r) => ({ key: r.id, carrierStatus: r.carrierStatus, orderStatusId: r.orderStatusId }));
}

export function DeliveryMethodFormDialog({
  trigger,
  method,
  entitySettings = [],
  statusRules = [],
  legalEntities,
  orderStatuses,
  onSaved,
}: {
  trigger: ReactElement;
  method?: DeliveryMethodRow;
  /** Усі конфігурації ЦЬОГО способу доставки, по одній на юридичну особу. */
  entitySettings?: DeliveryMethodEntitySettingsRow[];
  /** Усі правила статусів ЦЬОГО способу доставки (будь-якої юридичної особи). */
  statusRules?: DeliveryMethodStatusRuleRow[];
  legalEntities: CompanyLegalEntityRow[];
  orderStatuses: OrderStatusRow[];
  onSaved: () => void;
}) {
  const isEdit = Boolean(method);
  const isNovaPoshta = method?.carrierKey === "nova_poshta";
  const isSystemCarrier = Boolean(method && SYSTEM_CARRIER_KEYS.includes(method.carrierKey));
  const logo = method ? CARRIER_LOGOS[method.carrierKey] : undefined;
  const showEntitySelector = legalEntities.length > 1;

  const [open, setOpen] = useState(false);
  const [methodForm, setMethodForm] = useState<DeliveryMethodFormInput>(() => methodDefaultsFrom(method));
  const [legalEntityId, setLegalEntityId] = useState(() => legalEntities[0]?.id ?? "");
  const [entityForm, setEntityForm] = useState<DeliveryMethodEntitySettingsFormInput>(() =>
    entitySettingsFrom(entitySettings.find((s) => s.legalEntityId === legalEntities[0]?.id))
  );
  const [rules, setRules] = useState<StatusRuleDraft[]>(() =>
    draftsFrom(
      statusRules.filter((r) => {
        const settings = entitySettings.find((s) => s.legalEntityId === legalEntities[0]?.id);
        return settings && r.entitySettingsId === settings.id;
      })
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const testResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isTesting, startTesting] = useTransition();
  const [senderCounterparties, setSenderCounterparties] = useState<CarrierCounterparty[]>([]);
  const [contactPersons, setContactPersons] = useState<NovaPoshtaContactPerson[]>([]);
  const [isLoadingContactPersons, setIsLoadingContactPersons] = useState(false);
  const [npDataError, setNpDataError] = useState<string | null>(null);

  function setMethodField<K extends keyof DeliveryMethodFormInput>(field: K, value: DeliveryMethodFormInput[K]) {
    setMethodForm((prev) => ({ ...prev, [field]: value }));
  }

  function setEntityField<K extends keyof DeliveryMethodEntitySettingsFormInput>(
    field: K,
    value: DeliveryMethodEntitySettingsFormInput[K]
  ) {
    setEntityForm((prev) => ({ ...prev, [field]: value }));
  }

  /**
   * Підвантажує контактних осіб під контрагента. `preserveRef` — уже
   * збережений вибір (не змінюємо форму, лише даємо Select чим відобразити
   * назву); без нього — новий вибір, і якщо варіант рівно один, обираємо
   * його автоматично (пряма вказівка людини: «якщо один варіант — незрозуміло,
   * чи обрав я його» — односпискові Select більше не вимагають ручного кліку).
   */
  function fetchContactPersons(apiKey: string, counterpartyRef: string, preserveRef?: string) {
    setIsLoadingContactPersons(true);
    listContactPersonsAction(apiKey, counterpartyRef).then((result) => {
      setIsLoadingContactPersons(false);
      if (!result.ok) {
        setNpDataError(result.message);
        return;
      }
      setContactPersons(result.items);
      if (result.items.length === 1 && !preserveRef) {
        selectContactPerson(result.items[0].ref, result.items);
      }
    });
  }

  function selectContactPerson(ref: string | null, source: NovaPoshtaContactPerson[] = contactPersons) {
    const item = source.find((c) => c.ref === ref);
    setEntityField("senderContactPersonRef", ref ?? "");
    setEntityField("senderContactPerson", item?.name ?? "");
    setEntityField("senderPhone", item?.phone ?? "");
  }

  function selectCounterparty(ref: string | null, apiKey: string, source: CarrierCounterparty[] = senderCounterparties) {
    const item = source.find((c) => c.ref === ref);
    setEntityField("senderCounterpartyRef", ref ?? "");
    setEntityField("senderCounterparty", item?.name ?? "");
    setEntityField("senderContactPersonRef", "");
    setEntityField("senderContactPerson", "");
    setEntityField("senderPhone", "");
    setContactPersons([]);
    if (ref && apiKey) fetchContactPersons(apiKey, ref);
  }

  function loadEntityContext(entityId: string, apiKey: string) {
    const settings = entitySettings.find((s) => s.legalEntityId === entityId);
    const initial = entitySettingsFrom(settings);
    setEntityForm(initial);
    setRules(draftsFrom(settings ? statusRules.filter((r) => r.entitySettingsId === settings.id) : []));
    setSenderCounterparties([]);
    setContactPersons([]);
    setNpDataError(null);
    if (isNovaPoshta && apiKey) {
      listSenderCounterpartiesAction(apiKey).then((result) => {
        if (!result.ok) {
          setNpDataError(result.message);
          return;
        }
        setSenderCounterparties(result.items);
        if (result.items.length === 1 && !initial.senderCounterpartyRef) {
          selectCounterparty(result.items[0].ref, apiKey, result.items);
        } else if (initial.senderCounterpartyRef) {
          fetchContactPersons(apiKey, initial.senderCounterpartyRef, initial.senderContactPersonRef);
        }
      });
    }
  }

  function handleEntityChange(nextEntityId: string) {
    setLegalEntityId(nextEntityId);
    const settings = entitySettings.find((s) => s.legalEntityId === nextEntityId);
    loadEntityContext(nextEntityId, settings?.apiKey ?? "");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setMethodForm(methodDefaultsFrom(method));
      setError(null);
      setTestResult(null);
      const initialEntityId = legalEntities[0]?.id ?? "";
      setLegalEntityId(initialEntityId);
      const settings = entitySettings.find((s) => s.legalEntityId === initialEntityId);
      loadEntityContext(initialEntityId, settings?.apiKey ?? "");
    }
  }

  /** Іконка результату — тимчасова (зникає через 4с), не текст-повідомлення, що лишається назавжди. */
  function handleTestConnection() {
    if (testResultTimeoutRef.current) clearTimeout(testResultTimeoutRef.current);
    setTestResult(null);
    startTesting(async () => {
      const result = await testDeliveryApiKeyAction(method?.carrierKey ?? "", entityForm.apiKey);
      setTestResult(result);
      testResultTimeoutRef.current = setTimeout(() => setTestResult(null), 4000);
    });
  }

  function handleSave() {
    setError(null);
    startSaving(async () => {
      try {
        let methodId = method?.id;
        if (isEdit && method) {
          await updateDeliveryMethodAction(method.id, methodForm);
        } else {
          const created = await createDeliveryMethodAction(methodForm);
          methodId = created.id;
        }
        if (methodForm.requiresApiKey && methodId && legalEntityId) {
          await saveDeliveryMethodEntitySettingsAction(methodId, legalEntityId, {
            ...entityForm,
            statusRules: rules.map((r) => ({ carrierStatus: r.carrierStatus, orderStatusId: r.orderStatusId })),
          });
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
            {isEdit ? `Редагувати спосіб доставки — ${method?.name}` : "Додати спосіб доставки"}
          </DialogTitle>
          {!isEdit && <DialogDescription>Новий спосіб доставки з&apos;явиться в списку нижче.</DialogDescription>}
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FormSection>
            <h3 className="text-sm font-semibold text-foreground">Дані API</h3>
            {!isSystemCarrier && (
              <div className="mt-3 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="delivery-method-name">
                  Назва *
                </label>
                <Input
                  id="delivery-method-name"
                  value={methodForm.name}
                  onChange={(e) => setMethodField("name", e.target.value)}
                  placeholder="Наприклад, Нова Пошта"
                  autoFocus
                  className="sm:w-1/2"
                />
              </div>
            )}

            {methodForm.requiresApiKey && (
              <>
                {legalEntities.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Спершу додайте ФОП або ТОВ (Налаштування → Загальні) — конфігурація способу доставки належить
                    конкретній юридичній особі.
                  </p>
                ) : (
                  <>
                    {showEntitySelector && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Юридична особа</label>
                        <Select value={legalEntityId} onValueChange={(v) => v && handleEntityChange(v)}>
                          <SelectTrigger className="sm:w-1/2">
                            <SelectValue>
                              {(v: string) => legalEntities.find((e) => e.id === v)?.name ?? "Оберіть ЮО"}
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
                      </div>
                    )}

                    <div className="mt-3 flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-foreground" htmlFor="delivery-method-api-key">
                        API Key *
                      </label>
                      <div className="flex items-center gap-2 sm:w-2/3">
                        <Input
                          id="delivery-method-api-key"
                          value={entityForm.apiKey}
                          onChange={(e) => setEntityField("apiKey", e.target.value)}
                          placeholder="Ключ з особистого кабінету перевізника"
                          type="password"
                          autoComplete="new-password"
                          data-1p-ignore=""
                          data-lpignore="true"
                          data-bwignore="true"
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                          Перевірити підключення
                        </Button>
                        {testResult && (
                          <span className="animate-in fade-in zoom-in-50 duration-200">
                            {testResult.ok ? (
                              <CheckCircle2 className="size-6 text-success" aria-label="Ключ дійсний" />
                            ) : (
                              <XCircle className="size-6 text-destructive" aria-label="Не вдалося підключитись" />
                            )}
                          </span>
                        )}
                      </div>
                      {testResult && !testResult.ok && (
                        <p className="animate-in fade-in text-sm text-destructive duration-200">
                          Перевірте термін дії API ключа
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </FormSection>

          {methodForm.requiresApiKey && legalEntities.length > 0 && (
            <>
              <FormSection>
                <DeliveryMethodSenderFields
                  form={entityForm}
                  setField={setEntityField}
                  isNovaPoshta={isNovaPoshta}
                  senderCounterparties={senderCounterparties}
                  contactPersons={contactPersons}
                  isLoadingContactPersons={isLoadingContactPersons}
                  onCounterpartyChange={(ref) => selectCounterparty(ref, entityForm.apiKey)}
                  onContactPersonChange={(ref) => selectContactPerson(ref)}
                />
              </FormSection>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSection>
                  <DeliveryMethodPayerFields form={entityForm} setField={setEntityField} />
                </FormSection>
                <FormSection className="flex flex-col gap-4">
                  <DeliveryMethodPackagingFields form={entityForm} setField={setEntityField} />
                </FormSection>
              </div>

              <FormSection>
                <DeliveryMethodDescriptionFields form={entityForm} setField={setEntityField} />
              </FormSection>

              <FormSection>
                <DeliveryMethodAutomationFields
                  form={entityForm}
                  setField={setEntityField}
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
