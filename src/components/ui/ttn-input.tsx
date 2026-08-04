"use client";

import { Input } from "@/components/ui/input";

// Маска ЕН (експрес-накладної) — за прямою вказівкою людини, окремо від
// трьох "твердих" типів conventions.md (телефон/дробові/дата): Нова пошта
// "хх хххх хххх хххх" (2-4-4-4), Укрпошта "хх ххх хххх хх хх" (2-3-4-2-2).
// value/onChange — сам відображуваний рядок (як DateInput) — поле не
// обов'язкове й ще нічого не зберігає в БД.
export type TtnCarrier = "nova_poshta" | "ukrposhta";

const TTN_GROUPS: Record<TtnCarrier, number[]> = {
  nova_poshta: [2, 4, 4, 4],
  ukrposhta: [2, 3, 4, 2, 2],
};

export const TTN_PLACEHOLDERS: Record<TtnCarrier, string> = {
  nova_poshta: "хх хххх хххх хххх",
  ukrposhta: "хх ххх хххх хх хх",
};

function digitsFromValue(value: string, groups: number[]): string {
  const max = groups.reduce((sum, n) => sum + n, 0);
  return value.replace(/\D/g, "").slice(0, max);
}

function formatDigits(digits: string, groups: number[]): string {
  const parts: string[] = [];
  let i = 0;
  for (const size of groups) {
    if (i >= digits.length) break;
    parts.push(digits.slice(i, i + size));
    i += size;
  }
  return parts.join(" ");
}

export function TtnInput({
  carrier,
  value,
  onChange,
  ...props
}: {
  carrier: TtnCarrier;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  const groups = TTN_GROUPS[carrier];

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatDigits(digitsFromValue(e.target.value, groups), groups));
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={TTN_PLACEHOLDERS[carrier]}
      {...props}
    />
  );
}
