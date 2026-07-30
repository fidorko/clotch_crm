"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Той самий патерн "перегляд + олівчик → редагування", що й EditableTextRow, але
 * для числа з суфіксом (напр. "грн"). Ціна — завжди ціле число (Math.round при
 * кожній зміні, за математичними правилами округлення), не грн-і-копійки.
 */
export function EditableNumberRow({
  label,
  value,
  onChange,
  suffix = "грн",
  min = 0,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={min}
            step={step}
            autoFocus
            value={value}
            onChange={(e) => onChange(Math.round(Number(e.target.value)))}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditing(false);
            }}
            className="h-7 w-20 px-1.5 text-right text-sm"
          />
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between">
          <span className="text-sm text-foreground">
            {Math.round(value)} {suffix}
          </span>
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
  );
}
