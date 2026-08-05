"use client";

import { CreditCard, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DecimalInput } from "@/components/ui/decimal-input";
import type { DeliveryMethodFormInput } from "@/app/settings/delivery/actions";
import { NOVA_POSHTA_PAYER_TYPES } from "@/lib/constants/nova-poshta";

type FieldsProps = {
  form: DeliveryMethodFormInput;
  setField: <K extends keyof DeliveryMethodFormInput>(field: K, value: DeliveryMethodFormInput[K]) => void;
};

/**
 * «Хто платить» + «Контроль оголошеної вартості» — винесено з
 * DeliveryMethodSenderFields.tsx (переріс ліміт, CLAUDE.md розділ 0/9.6).
 * Варіанти платника — реальні значення CommonGeneral.getTypesOfPayers
 * (lib/constants/nova-poshta.ts), не вигадані.
 *
 * 2026-08-06, сьомий прохід — розділено на два окремі експортовані компоненти
 * (раніше один `DeliveryMethodShippingRulesFields`), щоб DeliveryMethodFormDialog.tsx
 * міг розкласти «Хто платить» в пару з «Пакування» (2 колонки), а «Опис
 * відправлення» — окремим повношириним блоком (людина попросила конкретну
 * розкладку попапу).
 */
export function DeliveryMethodPayerFields({ form, setField }: FieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <CreditCard className="size-4 text-muted-foreground" />
        Хто платить <span className="font-normal text-muted-foreground">(за замовчуванням отримувач)</span>
      </h3>
      <RadioGroup value={form.payer} onValueChange={(v) => setField("payer", v as DeliveryMethodFormInput["payer"])}>
        {NOVA_POSHTA_PAYER_TYPES.map((type) => (
          <label key={type.ref} className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value={type.ref} />
            {type.label}
          </label>
        ))}
      </RadioGroup>

      <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
        <span className="text-sm font-medium text-foreground">Контроль оголошеної вартості</span>
        <RadioGroup
          value={form.declaredValueMode}
          onValueChange={(v) => setField("declaredValueMode", v as DeliveryMethodFormInput["declaredValueMode"])}
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="order_amount" />
            Завжди дорівнює сумі замовлення
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="minimum_amount" />
            Мінімальна сума
          </label>
        </RadioGroup>
        {form.declaredValueMode === "minimum_amount" && (
          <div className="flex items-center gap-2 pl-6">
            <DecimalInput
              value={form.declaredValueMinimum}
              onChange={(v) => setField("declaredValueMinimum", v)}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">грн</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** «Опис відправлення» — окремий повношириний блок (сьомий прохід). */
export function DeliveryMethodDescriptionFields({ form, setField }: FieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <FileText className="size-4 text-muted-foreground" />
        Опис відправлення
      </h3>
      <span className="text-xs text-muted-foreground">Що підставляти в поле «Опис вантажу»</span>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <RadioGroup
          value={form.descriptionContent}
          onValueChange={(v) => setField("descriptionContent", v as DeliveryMethodFormInput["descriptionContent"])}
          className="grid grid-flow-col gap-x-6"
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="order_id" />
            ID замовлення
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="product_sku" />
            SKU
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="product_names" />
            Назви товарів
          </label>
        </RadioGroup>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={form.descriptionIncludeQuantity}
            onCheckedChange={(v) => setField("descriptionIncludeQuantity", v === true)}
          />
          Вказувати кількість
        </label>
      </div>
    </div>
  );
}
