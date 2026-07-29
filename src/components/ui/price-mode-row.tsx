"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { PriceModeValue } from "@/lib/types/product";

export function PriceModeRow({
  label,
  value,
  onChange,
  computeFromPercent,
  warning,
}: {
  label: string;
  value: PriceModeValue;
  onChange: (value: PriceModeValue) => void;
  computeFromPercent: (percent: number) => number;
  warning?: string;
}) {
  const isPercent = value.mode === "percent";
  const computedAmount = isPercent ? computeFromPercent(value.percent) : value.amount;

  // Попередження показуємо лише після Enter/blur (не на кожне натискання),
  // щоб воно не блимало під час набору — фіксуємо "прийняте" значення окремо.
  const [committedWarning, setCommittedWarning] = useState(warning);

  function commitWarning() {
    setCommittedWarning(warning);
  }

  return (
    <div className="flex flex-col gap-1 py-1.5">
      <div className="flex items-center gap-4">
        <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
        <div className="flex flex-1 items-center gap-1.5">
          <Input
            type="number"
            min={0}
            value={isPercent ? value.percent : value.amount}
            onChange={(e) =>
              onChange(
                isPercent
                  ? { ...value, percent: Number(e.target.value) }
                  : { ...value, amount: Number(e.target.value) }
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") commitWarning();
            }}
            onBlur={commitWarning}
            className="h-7 w-20 px-1.5 text-right text-sm"
          />
          <span className="w-8 shrink-0 text-sm text-muted-foreground">
            {isPercent ? "%" : "грн"}
          </span>
          <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-input p-0.5">
            <button
              type="button"
              onClick={() => onChange({ ...value, mode: "amount" })}
              className={cn(
                "rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors",
                !isPercent && "bg-accent font-medium text-foreground"
              )}
            >
              Грн
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...value, mode: "percent" })}
              className={cn(
                "rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors",
                isPercent && "bg-accent font-medium text-foreground"
              )}
            >
              %
            </button>
          </div>
          {isPercent && (
            <span className="shrink-0 text-xs text-muted-foreground">
              = {computedAmount.toFixed(2)} грн
            </span>
          )}
        </div>
      </div>
      <p
        className={cn(
          "ml-[calc(10rem+1rem)] text-xs text-destructive",
          !committedWarning && "invisible"
        )}
      >
        {committedWarning || " "}
      </p>
    </div>
  );
}
