"use client";

import { Phone } from "lucide-react";
import { IconInput } from "@/components/settings/SupplierIconInput";
import type { Input } from "@/components/ui/input";

// Маска телефону +380 XX XXX XX XX — тверде правило conventions.md
// ("Формати вводу"). value/onChange тут — нормалізований рядок для БД
// (`+380XXXXXXXXX`, без пробілів, "" — порожньо); форматований показ з
// пробілами — лише візуальний шар, users не можуть стерти/змінити префікс.
function digitsFromNormalized(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("380")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

function formatDigits(digits: string): string {
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(
    Boolean
  );
  return groups.join(" ");
}

export function PhoneInput({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  const digits = digitsFromNormalized(value);
  const display = digits ? `+380 ${formatDigits(digits)}` : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = digitsFromNormalized(e.target.value);
    onChange(digits ? `+380${digits}` : "");
  }

  return (
    <IconInput
      icon={Phone}
      type="tel"
      value={display}
      onChange={handleChange}
      placeholder="+380 XX XXX XX XX"
      {...props}
    />
  );
}
