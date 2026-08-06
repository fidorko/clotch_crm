"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { searchCustomersAction } from "@/app/orders/new/actions";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

export interface OrderCustomerValues {
  customerLastName: string;
  customerFirstName: string;
  customerMiddleName: string;
  customerPhone: string;
  customerEmail: string;
  customerComment: string;
}

/** ПІБ у 3 окремих полях → одне ім'я для customers.name (пряма вказівка людини). */
export function fullCustomerName(values: OrderCustomerValues): string {
  return [values.customerLastName, values.customerFirstName, values.customerMiddleName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * Клієнт — ПІБ у 3 окремих полях (Прізвище/Ім'я/По батькові)+телефон+email+
 * коментар. Окремого пошуку/вибору немає (пряма простота, orders.md):
 * достатньо ввести телефон, `createOrGetCustomer` (server/data/customers.ts)
 * сам знайде наявного клієнта за нормалізованим номером при збереженні. Тут —
 * лише "живий" натяк по blur: якщо номер уже є в базі, показуємо ім'я
 * знайденого клієнта (одним рядком — БД зберігає одне поле `name`, назад по
 * словах не розбиваємо), щоб людина не завела дубль з іншим написанням.
 * «Створити нового клієнта» — декоративна кнопка (форма й так створює нового
 * клієнта автоматично): просто чистить поля й фокусує Прізвище — окремого
 * попапу нема, не просили.
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
    setExistingHint(match ? match.name : null);
  }

  function handleNewCustomer() {
    setExistingHint(null);
    onChange({
      customerLastName: "",
      customerFirstName: "",
      customerMiddleName: "",
      customerPhone: "",
      customerEmail: "",
      customerComment: "",
    });
    document.getElementById("order-customer-last-name")?.focus();
  }

  return (
    <Card className="h-full gap-3 p-4">
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-semibold text-foreground">Клієнт</span>
          <Button variant="outline" size="sm" onClick={handleNewCustomer} type="button">
            <UserPlus className="size-4" />
            Новий клієнт
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Телефон</FieldLabel>
          <PhoneInput
            value={values.customerPhone}
            onChange={(v) => onChange({ customerPhone: v })}
            onBlur={handlePhoneBlur}
          />
          {existingHint && <p className="text-xs text-muted-foreground">Постійний клієнт: {existingHint}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Прізвище</FieldLabel>
          <Input
            id="order-customer-last-name"
            value={values.customerLastName}
            onChange={(e) => onChange({ customerLastName: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Ім&apos;я</FieldLabel>
            <Input
              id="order-customer-first-name"
              value={values.customerFirstName}
              onChange={(e) => onChange({ customerFirstName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>По батькові</FieldLabel>
            <Input
              id="order-customer-middle-name"
              value={values.customerMiddleName}
              onChange={(e) => onChange({ customerMiddleName: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Email (не обов&apos;язково)</FieldLabel>
          <Input
            type="email"
            value={values.customerEmail}
            onChange={(e) => onChange({ customerEmail: e.target.value })}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <FieldLabel>Коментар клієнта</FieldLabel>
          <Textarea
            value={values.customerComment}
            onChange={(e) => onChange({ customerComment: e.target.value })}
            className="flex-1"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
