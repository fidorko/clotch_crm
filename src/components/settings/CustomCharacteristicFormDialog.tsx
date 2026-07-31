"use client";

import { useState, useTransition, type KeyboardEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import type { CustomCharacteristicWithValues } from "@/server/data/custom-characteristics";
import {
  createCustomCharacteristicAction,
  updateCustomCharacteristicAction,
  type CustomCharacteristicFormInput,
} from "@/app/settings/references/custom/actions";

function defaultsFrom(characteristic: CustomCharacteristicWithValues | undefined): CustomCharacteristicFormInput {
  if (!characteristic) return { name: "", values: [] };
  return { name: characteristic.name, values: characteristic.values.map((v) => v.value) };
}

// Перемикачі (CRM/вітрина/фільтри) і видалення характеристики — прямо на
// плитці в ReferencesList (CustomCharacteristicTile), не тут: за прямою
// вказівкою, щоб не треба було відкривати попап заради швидкої дії.
export function CustomCharacteristicFormDialog({
  trigger,
  characteristic,
  onSaved,
}: {
  trigger: ReactElement;
  characteristic?: CustomCharacteristicWithValues;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(characteristic);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CustomCharacteristicFormInput>(() => defaultsFrom(characteristic));
  const [valueDraft, setValueDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function setField<K extends keyof CustomCharacteristicFormInput>(
    field: K,
    value: CustomCharacteristicFormInput[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setForm(defaultsFrom(characteristic));
      setValueDraft("");
      setError(null);
    }
  }

  function addValue() {
    const trimmed = valueDraft.trim();
    if (!trimmed || form.values.includes(trimmed)) {
      setValueDraft("");
      return;
    }
    setField("values", [...form.values, trimmed]);
    setValueDraft("");
  }

  function removeValue(value: string) {
    setField(
      "values",
      form.values.filter((v) => v !== value)
    );
  }

  function handleValueKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue();
    }
  }

  function handleSave() {
    setError(null);
    startSaving(async () => {
      try {
        if (isEdit && characteristic) {
          await updateCustomCharacteristicAction(characteristic.id, form);
        } else {
          await createCustomCharacteristicAction(form);
        }
        setOpen(false);
        onSaved?.();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти довідник");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Характеристика" : "Новий довідник характеристики"}</DialogTitle>
          <DialogDescription>
            Наприклад: характеристика «Тип комірця», значення — «Суцільнокрійний», «Крильце», «Ліхтарик».
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="characteristic-name">
              Характеристика *
            </label>
            <Input
              id="characteristic-name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Тип комірця"
              autoFocus={!isEdit}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="characteristic-value-input">
              Значення
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {form.values.map((value) => (
                <Badge key={value} variant="outline" className="gap-1 pr-1.5">
                  {value}
                  <button
                    type="button"
                    aria-label={`Прибрати значення ${value}`}
                    className="rounded-full hover:bg-muted"
                    onClick={() => removeValue(value)}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id="characteristic-value-input"
              value={valueDraft}
              onChange={(e) => setValueDraft(e.target.value)}
              onKeyDown={handleValueKeyDown}
              onBlur={addValue}
              placeholder="Введіть значення та натисніть Enter"
            />
          </div>

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
