"use client";

import { Calendar } from "lucide-react";
import { IconInput } from "@/components/settings/SupplierIconInput";
import type { Input } from "@/components/ui/input";

// Маска дати DD.MM.YYYY — тверде правило conventions.md ("Формати вводу").
// value/onChange тут — сам відображуваний рядок (можливо частковий під час
// набору, "24.05." тощо).
function digitsFromValue(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatDigits(digits: string): string {
  const groups = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return groups.join(".");
}

/**
 * Конвертація на межі УІ↔БД (conventions.md) — перше місце, де DateInput
 * торкається БД (`receiving_documents.planned_date`, warehouse-receiving.md).
 * Повертає `null`, якщо дата не введена повністю (не блокує автозбереження
 * решти полів формою).
 */
export function parseDateInputToIso(value: string): string | null {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function DateInput({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatDigits(digitsFromValue(e.target.value)));
  }

  return (
    <IconInput
      icon={Calendar}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder="ДД.ММ.РРРР"
      {...props}
    />
  );
}
