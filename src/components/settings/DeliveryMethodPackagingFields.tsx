"use client";

import { Package, Printer } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { DeliveryMethodFormInput } from "@/app/settings/delivery/actions";

/**
 * «Пакування» + «Маркування» — DeliveryMethodFormDialog.tsx переріс ліміт,
 * винесено окремим компонентом (CLAUDE.md, розділ 0/9.6).
 *
 * 2026-08-06, шостий прохід (пряма вказівка людини):
 * - «Пакування» — лише вмикач можливості (конкретну позицію з реального
 *   CommonGeneral.getPackList обирають пізніше, при створенні замовлення, не
 *   тут — раніше тут був 3-radio + пошуковий Combobox, прибрано).
 * - «Маркування» — вибір типу принтера (термо/звичайний) з реальними
 *   розмірами й поясненням (docs/carriers/novaposhta/printing.md, дослідив
 *   офіційні джерела Нової пошти — 101×101мм рулон для термопринтера, A4 6
 *   етикеток по 105×99мм для звичайного) замість вільних текстових полів
 *   «Формат етикетки»/«Формат ЕН»/«Принтер» (прибрано).
 */
export function DeliveryMethodPackagingFields({
  form,
  setField,
}: {
  form: DeliveryMethodFormInput;
  setField: <K extends keyof DeliveryMethodFormInput>(field: K, value: DeliveryMethodFormInput[K]) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Package className="size-4 text-muted-foreground" />
          Пакування
        </h3>
        <label className="flex items-center justify-between gap-3 text-sm text-foreground">
          Використовувати пакування Нової пошти
          <Switch
            checked={form.useCarrierPackaging}
            onCheckedChange={(v) => setField("useCarrierPackaging", v)}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Конкретний вид пакування (конверт, коробка тощо) обирається пізніше, під час оформлення замовлення.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Printer className="size-4 text-muted-foreground" />
          Маркування
        </h3>
        <span className="text-xs text-muted-foreground">Яке маркування використовувати для друку</span>
        <RadioGroup
          value={form.markingPrinterType}
          onValueChange={(v) => setField("markingPrinterType", v as DeliveryMethodFormInput["markingPrinterType"])}
        >
          <label className="flex items-start gap-2 text-sm text-foreground">
            <RadioGroupItem value="thermal" className="mt-0.5" />
            <span>
              Термопринтер
              <span className="block text-xs text-muted-foreground">
                101×101 мм, рулон на 500 етикеток (напр. Zebra GC420d)
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-foreground">
            <RadioGroupItem value="regular" className="mt-0.5" />
            <span>
              Звичайний принтер
              <span className="block text-xs text-muted-foreground">
                A4, 6 етикеток по 105×99 мм на аркуш (самоклейкий папір)
              </span>
            </span>
          </label>
        </RadioGroup>
      </div>
    </>
  );
}
