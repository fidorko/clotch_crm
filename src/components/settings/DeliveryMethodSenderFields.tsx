"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import type { DeliveryMethodFormInput } from "@/app/settings/delivery/actions";
import {
  searchDeliveryCitiesAction,
  searchDeliveryWarehousesAction,
  listContactPersonsAction,
} from "@/app/settings/delivery/np-lookup-actions";
import type { NpContactPerson, NpCounterparty } from "@/server/integrations/nova-poshta";

/**
 * Пошуковий комбобокс проти живого API НП (місто/відділення) — той самий
 * контрольований Combobox, що AddSkuCombobox (`value={null}` завжди —
 * транзитний пошук, не персистентний вибір), лише items оновлюється з
 * сервера через debounce, не з готового каталогу. Base UI сам скидає текст
 * інпуту після вибору, коли value лишається null (мітка "Нічого не знайдено"
 * — сумісний патерн), тому обраний варіант показуємо окремим рядком під
 * полем, а не намагаємось повернути його назад у текст пошуку.
 */
function NpSearchCombobox({
  selectedLabel,
  placeholder,
  disabled,
  onSearch,
  onSelect,
}: {
  selectedLabel: string;
  placeholder: string;
  disabled?: boolean;
  onSearch: (
    query: string
  ) => Promise<{ ok: true; items: { ref: string; description: string }[] } | { ok: false; message: string }>;
  onSelect: (item: { ref: string; description: string }) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<{ ref: string; description: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInputValueChange(next: string) {
    setInputValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(next).then((result) => setItems(result.ok ? result.items : []));
    }, 300);
  }

  const byRef = new Map(items.map((i) => [i.ref, i]));
  const refs = items.map((i) => i.ref);

  function handleValueChange(ref: string | null) {
    if (!ref) return;
    const item = byRef.get(ref);
    if (!item) return;
    onSelect(item);
    setInputValue("");
    setItems([]);
  }

  return (
    <div className="flex flex-col gap-1">
      <Combobox
        items={refs}
        value={null}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        itemToStringLabel={(ref: string) => byRef.get(ref)?.description ?? ref}
        disabled={disabled}
      >
        <ComboboxInputGroup>
          <ComboboxInput placeholder={placeholder} />
          <ComboboxTrigger />
        </ComboboxInputGroup>
        <ComboboxContent>
          {(ref: string) => {
            const item = byRef.get(ref);
            if (!item) return null;
            return (
              <ComboboxItem key={ref} value={ref}>
                {item.description}
              </ComboboxItem>
            );
          }}
        </ComboboxContent>
      </Combobox>
      {selectedLabel && <p className="text-xs text-muted-foreground">Обрано: {selectedLabel}</p>}
    </div>
  );
}

/** «Відправник за замовчуванням» — DeliveryMethodFormDialog.tsx переріс ліміт, винесено окремим компонентом (CLAUDE.md, розділ 0/9.6). 2026-08-05, третій прохід: для Нової пошти (isNovaPoshta) — реальні дані з Counterparty/Address API тенантського ключа, не вільний текст (пряма вказівка людини); для решти перевізників (без реальної інтеграції) лишається вільний ввід. */
export function DeliveryMethodSenderFields({
  form,
  setField,
  isNovaPoshta,
  senderCounterparties,
}: {
  form: DeliveryMethodFormInput;
  setField: <K extends keyof DeliveryMethodFormInput>(field: K, value: DeliveryMethodFormInput[K]) => void;
  isNovaPoshta: boolean;
  senderCounterparties: NpCounterparty[];
}) {
  const [contactPersons, setContactPersons] = useState<NpContactPerson[]>([]);

  function handleCounterpartyChange(ref: string | null) {
    const item = senderCounterparties.find((c) => c.ref === ref);
    setField("senderCounterpartyRef", ref ?? "");
    setField("senderCounterparty", item?.description ?? "");
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
    setField("senderContactPerson", item?.description ?? "");
    setField("senderPhone", item?.phone ? `+${item.phone}` : "");
  }

  if (!isNovaPoshta) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Відправник за замовчуванням</h3>
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
      <h3 className="text-sm font-semibold text-foreground">Відправник за замовчуванням</h3>
      <span className="text-xs text-muted-foreground">Реальні дані з вашого облікового запису Нової пошти</span>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Контрагент</label>
          <Select value={form.senderCounterpartyRef} onValueChange={handleCounterpartyChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) => senderCounterparties.find((c) => c.ref === v)?.description ?? "Оберіть контрагента"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {senderCounterparties.map((c) => (
                <SelectItem key={c.ref} value={c.ref}>
                  {c.description}
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
                {(v: string) => contactPersons.find((c) => c.ref === v)?.description ?? "Оберіть контактну особу"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {contactPersons.map((c) => (
                <SelectItem key={c.ref} value={c.ref}>
                  {c.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Телефон</label>
          <Input value={form.senderPhone} disabled placeholder="З контактної особи" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Місто</label>
          <NpSearchCombobox
            selectedLabel={form.senderCity}
            placeholder="Пошук міста..."
            onSearch={(query) => searchDeliveryCitiesAction(form.apiKey, query)}
            onSelect={(item) => {
              setField("senderCityRef", item.ref);
              setField("senderCity", item.description);
              setField("senderWarehouseRef", "");
              setField("senderAddressOrWarehouse", "");
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">Адреса / Відділення</label>
        <NpSearchCombobox
          selectedLabel={form.senderAddressOrWarehouse}
          placeholder={form.senderCityRef ? "Пошук відділення..." : "Спершу оберіть місто"}
          disabled={!form.senderCityRef}
          onSearch={(query) => searchDeliveryWarehousesAction(form.apiKey, form.senderCityRef, query)}
          onSelect={(item) => {
            setField("senderWarehouseRef", item.ref);
            setField("senderAddressOrWarehouse", item.description);
          }}
        />
      </div>
    </div>
  );
}
