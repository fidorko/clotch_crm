"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { PaymentStatusRow } from "@/server/data/payment-statuses";
import {
  createPaymentStatusAction,
  deletePaymentStatusAction,
  updatePaymentStatusAction,
} from "@/app/settings/references/payment-statuses/actions";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const SWATCH_CLASS =
  "size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none";

function DeletePaymentStatusButton({
  name,
  onConfirm,
  disabled,
}: {
  name: string;
  onConfirm: () => void;
  disabled: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити статус ${name}`} />
        }
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити статус?</DialogTitle>
          <DialogDescription>Статус «{name}» буде видалено з довідника.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
          <DialogClose render={<Button type="button" variant="destructive" onClick={onConfirm} />}>
            Видалити
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Новий, ще НЕ збережений рядок — той самий патерн, що NewOrderStatusRow.
function NewPaymentStatusRow({
  onCommit,
  onCancel,
}: {
  onCommit: (name: string, color: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#94A3B8");

  function commit() {
    const trimmed = name.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onCommit(trimmed, color);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        aria-label="Колір нового статусу"
        className={SWATCH_CLASS}
      />
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") onCancel();
        }}
        className="h-8 flex-1"
        placeholder="Введіть назву статусу"
      />
    </div>
  );
}

function PaymentStatusRowItem({
  status,
  onDelete,
  isDeleting,
}: {
  status: PaymentStatusRow;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(status.name);
  const [color, setColor] = useState(status.color);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const swatchColor = HEX_RE.test(color) ? color : status.color;

  function save(nextName: string, nextColor: string) {
    setError(null);
    startSaving(async () => {
      try {
        await updatePaymentStatusAction(status.id, nextName, nextColor);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти статус");
      }
    });
  }

  function commitColor(value: string) {
    const normalized = value.trim();
    if (!HEX_RE.test(normalized)) {
      setError("Код кольору має бути у форматі #RRGGBB");
      setColor(status.color);
      return;
    }
    setColor(normalized.toUpperCase());
    save(name, normalized);
  }

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(status.name);
      return;
    }
    setName(trimmed);
    save(trimmed, color);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <input
        type="color"
        value={swatchColor}
        onChange={(e) => commitColor(e.target.value)}
        aria-label={`Змінити колір для ${status.name}`}
        className={SWATCH_CLASS}
        disabled={isSaving}
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 flex-1"
        placeholder="Назва статусу"
        disabled={isSaving}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <DeletePaymentStatusButton name={status.name} disabled={isDeleting} onConfirm={() => onDelete(status.id)} />
    </div>
  );
}

export function PaymentStatusesList({ statuses }: { statuses: PaymentStatusRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isAddingDraft, setIsAddingDraft] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleCommitDraft(name: string, color: string) {
    setActionError(null);
    setIsCreating(true);
    startTransition(async () => {
      try {
        await createPaymentStatusAction(name, color);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося створити статус");
      } finally {
        setIsCreating(false);
        setIsAddingDraft(false);
      }
    });
  }

  function handleDelete(id: string) {
    setActionError(null);
    setPendingDeleteId(id);
    startTransition(async () => {
      try {
        await deletePaymentStatusAction(id);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити статус");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Статуси оплати замовлення — назва й колір бейджа.</p>
        <Button onClick={() => setIsAddingDraft(true)} disabled={isAddingDraft || isCreating}>
          <Plus className="size-4" />
          Додати статус
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="gap-0 py-2">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          {isAddingDraft && (
            <NewPaymentStatusRow onCommit={handleCommitDraft} onCancel={() => setIsAddingDraft(false)} />
          )}
          {statuses.map((status) => (
            <PaymentStatusRowItem
              key={status.id}
              status={status}
              onDelete={handleDelete}
              isDeleting={pendingDeleteId === status.id}
            />
          ))}
          {statuses.length === 0 && !isAddingDraft && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Статусів ще немає — натисніть «Додати статус»
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
