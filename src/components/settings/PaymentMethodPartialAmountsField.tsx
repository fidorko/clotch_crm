"use client";

import { Plus, SplitSquareHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";

export interface PartialAmountDraft {
  key: string;
  amount: string;
}

/**
 * Кілька варіантів суми часткової оплати (пряма вказівка людини, 2026-08-06,
 * другий прохід — "щоб можна було ввести декілька варіантів сум, а потім
 * відповідно можна було вибрати") — repeatable-список, той самий UI-патерн,
 * що правила статусів у DeliveryMethodAutomationFields.tsx. Кожна сума —
 * фіксоване значення, яке клієнт вносить одразу; решта надалі враховується
 * при розрахунку грошового переказу при отриманні (settings-payment.md).
 * Сам вибір потрібного варіанта при оформленні замовлення — ще не реалізований.
 */
export function PaymentMethodPartialAmountsField({
  amounts,
  onChange,
}: {
  amounts: PartialAmountDraft[];
  onChange: (amounts: PartialAmountDraft[]) => void;
}) {
  function addAmount() {
    onChange([...amounts, { key: crypto.randomUUID(), amount: "" }]);
  }

  function updateAmount(key: string, amount: string) {
    onChange(amounts.map((a) => (a.key === key ? { ...a, amount } : a)));
  }

  function removeAmount(key: string) {
    onChange(amounts.filter((a) => a.key !== key));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <SplitSquareHorizontal className="size-4 text-muted-foreground" />
        Варіанти суми часткової оплати
      </label>
      <p className="text-xs text-muted-foreground">
        Клієнт вносить одну з цих сум одразу — решта надалі враховується при розрахунку грошового переказу при
        отриманні.
      </p>
      <div className="flex flex-col gap-2">
        {amounts.map((draft) => (
          <div key={draft.key} className="flex items-center gap-2">
            <DecimalInput
              value={draft.amount}
              onChange={(v) => updateAmount(draft.key, v)}
              placeholder="0"
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">грн</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeAmount(draft.key)}
              aria-label="Видалити варіант суми"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addAmount}>
          <Plus className="size-4" />
          Додати варіант суми
        </Button>
      </div>
    </div>
  );
}
