"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { PriceModeValue } from "@/lib/types/product";

/**
 * Той самий патерн "перегляд + олівчик → редагування", що EditableNumberRow, але
 * з перемикачем Грн/%: у режимі % розрахована ціна лишається на тому самому місці
 * (де в режимі Грн — редагована сума), а поле вводу відсотка з'являється праворуч
 * від перемикача. І ціна, і відсоток — завжди цілі числа (Math.round при кожній
 * зміні й на розрахованому значенні — гривня без копійок, за прямим проханням).
 */
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
  const [isEditing, setIsEditing] = useState(false);
  const isPercent = value.mode === "percent";
  const computedAmount = isPercent ? computeFromPercent(value.percent) : value.amount;

  // Попередження показуємо лише після виходу з редагування (не на кожне натискання),
  // щоб воно не блимало під час набору — фіксуємо "прийняте" значення окремо.
  const [committedWarning, setCommittedWarning] = useState(warning);

  function stopEditing() {
    setIsEditing(false);
    setCommittedWarning(warning);
  }

  return (
    <div className="flex flex-col gap-1 py-1.5">
      <div className="flex items-center gap-4">
        <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
        {isEditing ? (
          <div
            className="flex flex-1 items-center gap-1.5"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) stopEditing();
            }}
          >
            {isPercent ? (
              <span className="w-20 shrink-0 text-right text-sm text-foreground">
                {Math.round(computedAmount)} грн
              </span>
            ) : (
              <Input
                autoFocus
                type="number"
                min={0}
                step={1}
                value={value.amount}
                onChange={(e) => onChange({ ...value, amount: Math.round(Number(e.target.value)) })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") stopEditing();
                }}
                className="h-7 w-20 px-1.5 text-right text-sm"
              />
            )}
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
              <>
                <Input
                  autoFocus
                  type="number"
                  min={0}
                  step={1}
                  value={value.percent}
                  onChange={(e) => onChange({ ...value, percent: Math.round(Number(e.target.value)) })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") stopEditing();
                  }}
                  className="h-7 w-16 px-1.5 text-right text-sm"
                />
                <span className="shrink-0 text-sm text-muted-foreground">%</span>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm text-foreground">{Math.round(computedAmount)} грн</span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label={`Редагувати ${label}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        )}
      </div>
      <p
        className={cn(
          "ml-44 text-xs text-destructive",
          !committedWarning && "invisible"
        )}
      >
        {committedWarning || " "}
      </p>
    </div>
  );
}
