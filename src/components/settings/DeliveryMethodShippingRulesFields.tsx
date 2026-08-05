"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DecimalInput } from "@/components/ui/decimal-input";
import type { DeliveryMethodFormInput } from "@/app/settings/delivery/actions";
import { NOVA_POSHTA_PAYER_TYPES, NOVA_POSHTA_SERVICE_TYPES } from "@/lib/constants/nova-poshta";

/** «Тип доставки можливий» + «Хто платить» + «Контроль оголошеної вартості» + «Опис відправлення» — винесено з DeliveryMethodSenderFields.tsx (переріс ліміт, CLAUDE.md розділ 0/9.6). Варіанти — реальні значення CommonGeneral.getServiceTypes/getTypesOfPayers, перевірені живим викликом (lib/constants/nova-poshta.ts), не вигадані. */
export function DeliveryMethodShippingRulesFields({
  form,
  setField,
}: {
  form: DeliveryMethodFormInput;
  setField: <K extends keyof DeliveryMethodFormInput>(field: K, value: DeliveryMethodFormInput[K]) => void;
}) {
  function toggleServiceType(ref: string, checked: boolean) {
    const next = checked
      ? [...form.allowedServiceTypes, ref]
      : form.allowedServiceTypes.filter((r) => r !== ref);
    setField("allowedServiceTypes", next);
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          Тип доставки можливий <span className="font-normal text-muted-foreground">(за замовчуванням усі)</span>
        </h3>
        {NOVA_POSHTA_SERVICE_TYPES.map((type) => (
          <label key={type.ref} className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={form.allowedServiceTypes.includes(type.ref)}
              onCheckedChange={(v) => toggleServiceType(type.ref, v === true)}
            />
            {type.label}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">
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
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Контроль оголошеної вартості</h3>
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

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Опис відправлення</h3>
        <span className="text-xs text-muted-foreground">Що підставляти в поле «Опис вантажу»</span>
        <RadioGroup
          value={form.descriptionContent}
          onValueChange={(v) => setField("descriptionContent", v as DeliveryMethodFormInput["descriptionContent"])}
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="order_id" />
            ID замовлення
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="product_sku" />
            Артикул товару
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
    </>
  );
}
