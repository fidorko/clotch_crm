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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { CurrencyRow } from "@/server/data/currencies";
import {
  createCurrencyAction,
  updateCurrencyAction,
  type CurrencyFormInput,
} from "@/app/settings/references/currencies/actions";

const PREVIEW_AMOUNT = 1234.56;

function formatPreview(symbol: string, position: "before" | "after", decimalPlaces: number): string {
  const formatted = PREVIEW_AMOUNT.toLocaleString("uk-UA", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  if (!symbol) return formatted;
  return position === "before" ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}

function defaultsFrom(currency: CurrencyRow | undefined): CurrencyFormInput {
  if (!currency) {
    return {
      name: "",
      code: "",
      symbol: "",
      symbolPosition: "after",
      decimalPlaces: 2,
      isActive: true,
      isDefault: false,
      autoUpdate: true,
    };
  }
  return {
    name: currency.name,
    code: currency.code,
    symbol: currency.symbol,
    symbolPosition: currency.symbolPosition,
    decimalPlaces: currency.decimalPlaces,
    isActive: currency.isActive,
    isDefault: currency.isDefault,
    autoUpdate: currency.autoUpdate,
  };
}

export function CurrencyFormDialog({
  trigger,
  currency,
  onSaved,
}: {
  trigger: ReactElement;
  currency?: CurrencyRow;
  onSaved: () => void;
}) {
  const isEdit = Boolean(currency);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CurrencyFormInput>(() => defaultsFrom(currency));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function setField<K extends keyof CurrencyFormInput>(field: K, value: CurrencyFormInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setForm(defaultsFrom(currency));
      setError(null);
    }
  }

  function handleSave() {
    setError(null);
    startSaving(async () => {
      try {
        if (isEdit && currency) {
          await updateCurrencyAction(currency.id, form);
        } else {
          await createCurrencyAction(form);
        }
        setOpen(false);
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти валюту");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редагувати валюту" : "Додати валюту"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Зміни зберігаються одразу для всього тенанта." : "Нова валюта з'явиться в довіднику."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="currency-name">
              Назва *
            </label>
            <Input
              id="currency-name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Українська гривня"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="currency-code">
              Код ISO *
            </label>
            <Input
              id="currency-code"
              value={form.code}
              onChange={(e) => setField("code", e.target.value.toUpperCase().slice(0, 3))}
              placeholder="UAH"
              maxLength={3}
              className="w-24 font-mono uppercase"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="currency-symbol">
              Символ
            </label>
            <Input
              id="currency-symbol"
              value={form.symbol}
              onChange={(e) => setField("symbol", e.target.value)}
              placeholder="₴"
              className="w-24"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Позиція символу</span>
            <RadioGroup
              value={form.symbolPosition}
              onValueChange={(v) => setField("symbolPosition", v as "before" | "after")}
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="before" />
                Перед сумою ({formatPreview(form.symbol || "$", "before", form.decimalPlaces)})
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="after" />
                Після суми ({formatPreview(form.symbol || "грн", "after", form.decimalPlaces)})
              </label>
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="currency-decimals">
              Кількість знаків після коми
            </label>
            <Input
              id="currency-decimals"
              type="number"
              min={0}
              max={4}
              value={form.decimalPlaces}
              onChange={(e) => setField("decimalPlaces", Number(e.target.value))}
              className="w-24"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Формат: <span className="font-medium text-foreground">{formatPreview(form.symbol, form.symbolPosition, form.decimalPlaces)}</span>
          </p>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={form.isActive} onCheckedChange={(v) => setField("isActive", v === true)} />
            Активна
          </label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={form.isDefault} onCheckedChange={(v) => setField("isDefault", v === true)} />
            Валюта за замовчуванням
          </label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={form.autoUpdate} onCheckedChange={(v) => setField("autoUpdate", v === true)} />
            Автооновлення курсу (з НБУ)
          </label>

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
