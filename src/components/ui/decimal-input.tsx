"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

// Дробові числа — ввід і показ через кому (conventions.md, "Формати вводу"),
// у БД лишається крапка (numeric() Drizzle/Postgres — формат SQL, локалі
// байдуже). value/onChange тут — рядок із крапкою ("12.5", "" — порожньо),
// як і очікує решта коду (FormData/Number()) — лише візуальний шар з комою.
// Власна чернетка під час набору (як EditableTextRow/Row-компоненти,
// conventions.md) — інакше проміжний ввід на кшталт "12," затирався б назад
// у "12" при кожному ре-рендері з батька.
function toDotString(displayValue: string): string {
  const firstComma = displayValue.indexOf(",");
  const withoutExtraCommas =
    firstComma === -1
      ? displayValue
      : displayValue.slice(0, firstComma + 1) + displayValue.slice(firstComma + 1).replace(/,/g, "");
  return withoutExtraCommas.replace(",", ".");
}

function toCommaDisplay(dotValue: string): string {
  return dotValue.replace(".", ",");
}

export function DecimalInput({
  value,
  onChange,
  className,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  const [draft, setDraft] = useState(() => toCommaDisplay(value));
  // Синхронізація чернетки із зовнішнім value без ефекту (правило React —
  // adjusting state when a prop changes: оновлення стану під час рендеру, не
  // в useEffect, інакше react-hooks/set-state-in-effect).
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(toCommaDisplay(value));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/[^0-9,]/g, "");
    setDraft(cleaned);
    onChange(toDotString(cleaned));
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
