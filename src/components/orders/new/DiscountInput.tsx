"use client";

import { DecimalInput } from "@/components/ui/decimal-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrderDiscountTypeValue } from "@/server/data/orders";

const DISCOUNT_TYPE_LABEL: Record<OrderDiscountTypeValue, string> = {
  percent: "%",
  amount: "грн",
};

/**
 * Знижка (%/сума) — спільний контрол для рядка товару (OrderItemsCard) і
 * знижки на замовлення в цілому (OrderSummaryCard), 2 використання (ui-kit.md,
 * правило 9.2 CLAUDE.md). type=null означає "без знижки" — value теж null.
 */
export function DiscountInput({
  type,
  value,
  onChange,
  className,
}: {
  type: OrderDiscountTypeValue | null;
  value: string;
  onChange: (type: OrderDiscountTypeValue | null, value: string) => void;
  className?: string;
}) {
  return (
    <div className={className ? `flex items-center gap-1 ${className}` : "flex items-center gap-1"}>
      <DecimalInput
        value={value}
        onChange={(v) => onChange(type ?? "percent", v)}
        className="h-8 w-16 text-right"
        placeholder="0"
      />
      <Select
        value={type ?? "__none__"}
        onValueChange={(v) => {
          if (!v || v === "__none__") {
            onChange(null, "");
            return;
          }
          onChange(v as OrderDiscountTypeValue, value);
        }}
      >
        <SelectTrigger size="sm" className="h-8 w-16 border-transparent px-1.5 hover:border-input">
          <SelectValue>{(v: string) => (v === "__none__" ? "—" : DISCOUNT_TYPE_LABEL[v as OrderDiscountTypeValue])}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Без знижки</SelectItem>
          <SelectItem value="percent">%</SelectItem>
          <SelectItem value="amount">грн</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
