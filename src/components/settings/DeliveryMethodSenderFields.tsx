"use client";

import { useState } from "react";
import { Warehouse } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NpSearchCombobox } from "@/components/carriers/NpSearchCombobox";
import type { DeliveryMethodFormInput } from "@/app/settings/delivery/actions";
import {
  searchDeliveryCitiesAction,
  searchDeliveryStreetsAction,
  searchDeliveryWarehousesAction,
  listContactPersonsAction,
} from "@/app/settings/delivery/np-lookup-actions";
import type { CarrierCounterparty } from "@/server/carriers/carrier.interface";
import type { NovaPoshtaContactPerson } from "@/server/carriers/novaposhta/mapper";

/** «Відправник за замовчуванням» — DeliveryMethodFormDialog.tsx переріс ліміт, винесено окремим компонентом (CLAUDE.md, розділ 0/9.6). 2026-08-05, третій прохід: для Нової пошти (isNovaPoshta) — реальні дані з Counterparty/Address API тенантського ключа, не вільний текст (пряма вказівка людини); для решти перевізників (без реальної інтеграції) лишається вільний ввід. 2026-08-06, шостий прохід — обирається РАЗ, звідки відправляємо (відділення чи адреса), не набір типів доставки (прибрано, DeliveryMethodShippingRulesFields.tsx). */
export function DeliveryMethodSenderFields({
  form,
  setField,
  isNovaPoshta,
  senderCounterparties,
}: {
  form: DeliveryMethodFormInput;
  setField: <K extends keyof DeliveryMethodFormInput>(field: K, value: DeliveryMethodFormInput[K]) => void;
  isNovaPoshta: boolean;
  senderCounterparties: CarrierCounterparty[];
}) {
  const [contactPersons, setContactPersons] = useState<NovaPoshtaContactPerson[]>([]);

  function handleCounterpartyChange(ref: string | null) {
    const item = senderCounterparties.find((c) => c.ref === ref);
    setField("senderCounterpartyRef", ref ?? "");
    setField("senderCounterparty", item?.name ?? "");
    setField("senderContactPersonRef", "");
    setField("senderContactPerson", "");
    setField("senderPhone", "");
    setContactPersons([]);
    if (ref && form.apiKey) {
      listContactPersonsAction(form.apiKey, ref).then((result) => {
        if (result.ok) setContactPersons(result.items);
      });
    }
  }

  function handleContactPersonChange(ref: string | null) {
    const item = contactPersons.find((c) => c.ref === ref);
    setField("senderContactPersonRef", ref ?? "");
    setField("senderContactPerson", item?.name ?? "");
    setField("senderPhone", item?.phone ?? "");
  }

  function handleCityChange(item: { ref: string; name: string }) {
    setField("senderCityRef", item.ref);
    setField("senderCity", item.name);
    setField("senderWarehouseRef", "");
    setField("senderAddressOrWarehouse", "");
    setField("senderStreetRef", "");
    setField("senderStreet", "");
  }

  const sectionTitle = (
    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
      <Warehouse className="size-4 text-muted-foreground" />
      Відправник за замовчуванням
    </h3>
  );

  if (!isNovaPoshta) {
    return (
      <div className="flex flex-col gap-3">
        {sectionTitle}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Контрагент</label>
            <Input
              value={form.senderCounterparty}
              onChange={(e) => setField("senderCounterparty", e.target.value)}
              placeholder="Назва компанії"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Контактна особа</label>
            <Input
              value={form.senderContactPerson}
              onChange={(e) => setField("senderContactPerson", e.target.value)}
              placeholder="ПІБ"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Телефон</label>
            <PhoneInput value={form.senderPhone} onChange={(v) => setField("senderPhone", v)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Місто</label>
            <Input
              value={form.senderCity}
              onChange={(e) => setField("senderCity", e.target.value)}
              placeholder="Київ"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Адреса / Відділення</label>
          <Input
            value={form.senderAddressOrWarehouse}
            onChange={(e) => setField("senderAddressOrWarehouse", e.target.value)}
            placeholder="Напр. Відділення №1"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sectionTitle}
      <span className="text-xs text-muted-foreground">Реальні дані з вашого облікового запису Нової пошти</span>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Контрагент</label>
          <Select value={form.senderCounterpartyRef} onValueChange={handleCounterpartyChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) => senderCounterparties.find((c) => c.ref === v)?.name ?? "Оберіть контрагента"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {senderCounterparties.map((c) => (
                <SelectItem key={c.ref} value={c.ref}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Контактна особа</label>
          <Select
            value={form.senderContactPersonRef}
            onValueChange={handleContactPersonChange}
            disabled={!form.senderCounterpartyRef}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) => contactPersons.find((c) => c.ref === v)?.name ?? "Оберіть контактну особу"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {contactPersons.map((c) => (
                <SelectItem key={c.ref} value={c.ref}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">Телефон</label>
        <Input value={form.senderPhone} disabled placeholder="З контактної особи" className="w-1/2" />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">Звідки відправляємо — обирається один раз</span>
        <RadioGroup
          value={form.senderAddressType}
          onValueChange={(v) => setField("senderAddressType", v as DeliveryMethodFormInput["senderAddressType"])}
          className="grid grid-cols-2"
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="warehouse" />
            Відділення
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="address" />
            Адреса
          </label>
        </RadioGroup>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Місто</label>
            <NpSearchCombobox
              selectedLabel={form.senderCity}
              placeholder="Пошук міста..."
              onSearch={(query) => searchDeliveryCitiesAction(form.apiKey, query)}
              onSelect={handleCityChange}
            />
          </div>

          {form.senderAddressType === "warehouse" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Відділення</label>
              <NpSearchCombobox
                selectedLabel={form.senderAddressOrWarehouse}
                placeholder={form.senderCityRef ? "Пошук відділення..." : "Спершу оберіть місто"}
                disabled={!form.senderCityRef}
                onSearch={(query) => searchDeliveryWarehousesAction(form.apiKey, form.senderCityRef, query)}
                onSelect={(item) => {
                  setField("senderWarehouseRef", item.ref);
                  setField("senderAddressOrWarehouse", item.name);
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Вулиця</label>
              <NpSearchCombobox
                selectedLabel={form.senderStreet}
                placeholder={form.senderCityRef ? "Пошук вулиці..." : "Спершу оберіть місто"}
                disabled={!form.senderCityRef}
                onSearch={(query) => searchDeliveryStreetsAction(form.apiKey, form.senderCityRef, query)}
                onSelect={(item) => {
                  setField("senderStreetRef", item.ref);
                  setField("senderStreet", item.name);
                }}
              />
            </div>
          )}
        </div>

        {form.senderAddressType === "address" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Будинок</label>
            <Input
              value={form.senderHouseNumber}
              onChange={(e) => setField("senderHouseNumber", e.target.value)}
              placeholder="Напр. 12А"
              className="w-28"
            />
          </div>
        )}
      </div>
    </div>
  );
}
