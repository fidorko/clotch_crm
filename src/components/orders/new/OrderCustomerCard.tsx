"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { searchCustomersAction } from "@/app/orders/new/actions";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

export interface OrderCustomerValues {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

/**
 * Клієнт — ім'я+телефон+email. Окремого пошуку/вибору немає (пряма
 * простота, orders.md): достатньо ввести телефон, `createOrGetCustomer`
 * (server/data/customers.ts) сам знайде наявного клієнта за нормалізованим
 * номером при збереженні. Тут — лише "живий" натяк по blur: якщо номер уже
 * є в базі, показуємо ім'я знайденого клієнта, щоб людина не завела дубль з
 * іншим написанням імені.
 */
export function OrderCustomerCard({
  values,
  onChange,
}: {
  values: OrderCustomerValues;
  onChange: (patch: Partial<OrderCustomerValues>) => void;
}) {
  const [existingHint, setExistingHint] = useState<string | null>(null);

  async function handlePhoneBlur() {
    if (values.customerPhone.replace(/\D/g, "").length < 12) {
      setExistingHint(null);
      return;
    }
    const found = await searchCustomersAction(values.customerPhone);
    const match = found.find((c) => c.phone === values.customerPhone);
    if (match) {
      setExistingHint(match.name);
      if (!values.customerName.trim()) onChange({ customerName: match.name });
    } else {
      setExistingHint(null);
    }
  }

  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Клієнт</span>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Телефон</FieldLabel>
            <PhoneInput
              value={values.customerPhone}
              onChange={(v) => onChange({ customerPhone: v })}
              onBlur={handlePhoneBlur}
            />
            {existingHint && (
              <p className="text-xs text-muted-foreground">Постійний клієнт: {existingHint}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Ім&apos;я</FieldLabel>
            <Input value={values.customerName} onChange={(e) => onChange({ customerName: e.target.value })} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Email (не обов&apos;язково)</FieldLabel>
          <Input
            type="email"
            value={values.customerEmail}
            onChange={(e) => onChange({ customerEmail: e.target.value })}
            className="w-1/2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
