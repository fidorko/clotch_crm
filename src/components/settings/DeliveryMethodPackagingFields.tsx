"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import type { DeliveryMethodFormInput } from "@/app/settings/delivery/actions";
import type { NpPackItem } from "@/server/integrations/nova-poshta";

/** «Пакування» + «Друк» — DeliveryMethodFormDialog.tsx переріс ліміт, винесено окремим компонентом (CLAUDE.md, розділ 0/9.6). 2026-08-05, третій прохід: коли обрано «Пакування перевізника» для Нової пошти — реальний перелік CommonGeneral.getPackList (пряма вказівка людини), не декоративний варіант. */
export function DeliveryMethodPackagingFields({
  form,
  setField,
  isNovaPoshta,
  packList,
}: {
  form: DeliveryMethodFormInput;
  setField: <K extends keyof DeliveryMethodFormInput>(field: K, value: DeliveryMethodFormInput[K]) => void;
  isNovaPoshta: boolean;
  packList: NpPackItem[];
}) {
  const [packQuery, setPackQuery] = useState(form.packDescription);
  const byRef = new Map(packList.map((p) => [p.ref, p]));
  const refs = packList.map((p) => p.ref);

  return (
    <>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Пакування</h3>
        <RadioGroup
          value={form.packaging}
          onValueChange={(v) => setField("packaging", v as DeliveryMethodFormInput["packaging"])}
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="none" />
            Не використовувати
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="carrier_packaging" />
            {isNovaPoshta ? "Пакування Нової пошти" : "Пакування перевізника"}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="own_packaging" />
            Власне пакування
          </label>
        </RadioGroup>
        {form.packaging === "carrier_packaging" && isNovaPoshta && (
          <div className="pl-6">
            <Combobox
              items={refs}
              value={form.packRef || null}
              onValueChange={(ref: string | null) => {
                if (!ref) return;
                const item = byRef.get(ref);
                setField("packRef", ref);
                setField("packDescription", item?.description ?? "");
                setPackQuery(item?.description ?? "");
              }}
              inputValue={packQuery}
              onInputValueChange={setPackQuery}
              itemToStringLabel={(ref: string) => byRef.get(ref)?.description ?? ref}
            >
              <ComboboxInputGroup>
                <ComboboxInput placeholder="Пошук пакування..." />
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
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Друк</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Формат етикетки</label>
            <Input
              value={form.labelFormat}
              onChange={(e) => setField("labelFormat", e.target.value)}
              placeholder="Напр. 100x100 мм"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Формат ЕН</label>
            <Input
              value={form.waybillFormat}
              onChange={(e) => setField("waybillFormat", e.target.value)}
              placeholder="Напр. A4"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Принтер</label>
          <Input
            value={form.printerName}
            onChange={(e) => setField("printerName", e.target.value)}
            placeholder="Назва принтера"
          />
        </div>
      </div>
    </>
  );
}
