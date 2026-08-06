"use client";

import { useState, useTransition, type ReactElement } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PaymentMethodPartialAmountsField,
  type PartialAmountDraft,
} from "@/components/settings/PaymentMethodPartialAmountsField";
import type { PaymentMethodPartialAmountRow, PaymentMethodRow } from "@/server/data/payment-methods";
import {
  createPaymentMethodAction,
  updatePaymentMethodAction,
  type PaymentMethodFormInput,
} from "@/app/settings/payment/actions";
import { PAYMENT_METHOD_KIND_ICONS, SYSTEM_PAYMENT_METHOD_KINDS } from "@/lib/constants/payment-methods";

function defaultsFrom(method: PaymentMethodRow | undefined): Omit<PaymentMethodFormInput, "partialAmounts"> {
  if (!method) return { name: "", isEnabled: true };
  return { name: method.name, isEnabled: method.isEnabled };
}

function draftsFrom(amounts: PaymentMethodPartialAmountRow[]): PartialAmountDraft[] {
  return amounts.map((a) => ({ key: a.id, amount: a.amount }));
}

export function PaymentMethodFormDialog({
  trigger,
  method,
  partialAmounts = [],
  onSaved,
}: {
  trigger: ReactElement;
  method?: PaymentMethodRow;
  partialAmounts?: PaymentMethodPartialAmountRow[];
  onSaved: () => void;
}) {
  const isEdit = Boolean(method);
  const isSystemMethod = Boolean(method && SYSTEM_PAYMENT_METHOD_KINDS.includes(method.kind));
  const isPartialPayment = method?.kind === "partial_payment";
  const Icon = PAYMENT_METHOD_KIND_ICONS[method?.kind ?? "custom"];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => defaultsFrom(method));
  const [amounts, setAmounts] = useState<PartialAmountDraft[]>(() => draftsFrom(partialAmounts));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function setField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setForm(defaultsFrom(method));
      setAmounts(draftsFrom(partialAmounts));
      setError(null);
    }
  }

  function handleSave() {
    setError(null);
    const input: PaymentMethodFormInput = { ...form, partialAmounts: amounts.map((a) => a.amount) };
    startSaving(async () => {
      try {
        if (isEdit && method) {
          await updatePaymentMethodAction(method.id, input);
        } else {
          await createPaymentMethodAction(input);
        }
        setOpen(false);
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти спосіб оплати");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5 text-muted-foreground" />
            {isEdit ? "Редагувати спосіб оплати" : "Додати спосіб оплати"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Зміни зберігаються одразу для всього тенанта."
              : "Новий спосіб оплати з'явиться в списку нижче."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="payment-method-name">
              Назва *
            </label>
            <Input
              id="payment-method-name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Наприклад, Оплата частинами"
              autoFocus={!isSystemMethod}
              disabled={isSystemMethod}
            />
            {isSystemMethod && (
              <p className="text-xs text-muted-foreground">Системний спосіб оплати — назва не редагується.</p>
            )}
          </div>

          {isPartialPayment && <PaymentMethodPartialAmountsField amounts={amounts} onChange={setAmounts} />}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
