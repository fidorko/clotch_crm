"use client";

import { Input } from "@/components/ui/input";

export function NumberRow({
  label,
  value,
  suffix,
  onChange,
  min = 0,
  step,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-7 w-24 px-2 text-right text-sm"
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
