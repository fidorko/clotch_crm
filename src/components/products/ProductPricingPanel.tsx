"use client";

import { Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditableNumberRow } from "@/components/ui/editable-number-row";
import { PriceModeRow } from "@/components/ui/price-mode-row";
import { Switch } from "@/components/ui/switch";
import type { Product } from "@/lib/types/product";

function calcMarginPercent(sellPrice: number, purchasePrice: number) {
  if (sellPrice <= 0) return 0;
  return ((sellPrice - purchasePrice) / sellPrice) * 100;
}

function MarginTile({
  label,
  percent,
  amount,
}: {
  label: string;
  percent: number;
  amount: number;
}) {
  const isNegative = percent < 0;

  return (
    <div className="flex items-start gap-2">
      <Percent className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            "text-sm font-medium text-foreground",
            isNegative && "text-destructive"
          )}
        >
          {percent.toFixed(1)}% · {amount.toFixed(2)} грн
        </span>
      </div>
    </div>
  );
}

/**
 * Цінова політика товару — окремий блок (за прямою вказівкою людини, 2026-08-03):
 * закупівельна ціна перша, бо решта рахується від неї (режим «%» у PriceModeRow),
 * знижка — від уже порахованої роздрібної, маржа — підсумок унизу.
 * Раніше ці рядки жили в ProductInfoPanel упереміш із характеристиками.
 */
export function ProductPricingPanel({
  pricing,
  onPricingChange,
}: {
  pricing: Product["pricing"];
  onPricingChange: <K extends keyof Product["pricing"]>(
    field: K,
    value: Product["pricing"][K]
  ) => void;
}) {
  const retailAmount =
    pricing.retail.mode === "percent"
      ? pricing.purchasePrice * (1 + pricing.retail.percent / 100)
      : pricing.retail.amount;
  const wholesaleAmount =
    pricing.wholesale.mode === "percent"
      ? pricing.purchasePrice * (1 + pricing.wholesale.percent / 100)
      : pricing.wholesale.amount;
  const dropshipAmount =
    pricing.dropship.mode === "percent"
      ? pricing.purchasePrice * (1 + pricing.dropship.percent / 100)
      : pricing.dropship.amount;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between px-4">
        <CardTitle className="text-sm font-medium">Ціни та маржа</CardTitle>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          Для всіх розмірів однакова
          <Switch
            checked={pricing.sameForAllSizes}
            onCheckedChange={(checked) => onPricingChange("sameForAllSizes", checked)}
          />
        </label>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border px-4">
        <EditableNumberRow
          label="Закупівельна ціна"
          value={pricing.purchasePrice}
          onChange={(value) => onPricingChange("purchasePrice", value)}
        />
        <PriceModeRow
          label="Моя роздрібна ціна"
          value={pricing.retail}
          onChange={(value) => onPricingChange("retail", value)}
          computeFromPercent={(percent) => pricing.purchasePrice * (1 + percent / 100)}
          warning={
            retailAmount < pricing.purchasePrice ? "Ціна нижча за закупівельну" : undefined
          }
        />
        <EditableNumberRow
          label="Перечеркнута ціна"
          value={pricing.oldPrice}
          onChange={(value) => onPricingChange("oldPrice", value)}
        />
        <PriceModeRow
          label="Моя оптова ціна"
          value={pricing.wholesale}
          onChange={(value) => onPricingChange("wholesale", value)}
          computeFromPercent={(percent) => pricing.purchasePrice * (1 + percent / 100)}
          warning={
            wholesaleAmount < pricing.purchasePrice ? "Ціна нижча за закупівельну" : undefined
          }
        />
        <PriceModeRow
          label="Моя ціна дропшипперам"
          value={pricing.dropship}
          onChange={(value) => onPricingChange("dropship", value)}
          computeFromPercent={(percent) => pricing.purchasePrice * (1 + percent / 100)}
          warning={
            dropshipAmount < pricing.purchasePrice ? "Ціна нижча за закупівельну" : undefined
          }
        />
        <PriceModeRow
          label="Знижка роздрібна"
          value={pricing.retailDiscount}
          onChange={(value) => onPricingChange("retailDiscount", value)}
          computeFromPercent={(percent) => retailAmount * (1 - percent / 100)}
        />
        <div className="grid grid-cols-3 gap-3 py-2">
          <MarginTile
            label="Маржа роздріб"
            percent={calcMarginPercent(retailAmount, pricing.purchasePrice)}
            amount={retailAmount - pricing.purchasePrice}
          />
          <MarginTile
            label="Маржа опт"
            percent={calcMarginPercent(wholesaleAmount, pricing.purchasePrice)}
            amount={wholesaleAmount - pricing.purchasePrice}
          />
          <MarginTile
            label="Маржа дроп"
            percent={calcMarginPercent(dropshipAmount, pricing.purchasePrice)}
            amount={dropshipAmount - pricing.purchasePrice}
          />
        </div>
      </CardContent>
    </Card>
  );
}
