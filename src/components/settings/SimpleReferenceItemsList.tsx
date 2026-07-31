"use client";

import { useState, useTransition } from "react";
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

interface SimpleItem {
  id: string;
  name: string;
}

function DeleteItemButton({
  name,
  warning,
  onConfirm,
  disabled,
}: {
  name: string;
  warning?: string;
  onConfirm: () => void;
  disabled: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити ${name}`} />}
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити значення?</DialogTitle>
          <DialogDescription>
            «{name}» буде видалено безповоротно. {warning}
          </DialogDescription>
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

function ItemRow({
  item,
  warning,
  onUpdate,
  onDelete,
  isDeleting,
}: {
  item: SimpleItem;
  warning?: string;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [name, setName] = useState(item.name);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function commit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(item.name);
      return;
    }
    if (trimmed === item.name) return;
    setError(null);
    startSaving(async () => {
      try {
        await onUpdate(item.id, trimmed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти");
        setName(item.name);
      }
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 flex-1"
        disabled={isSaving}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <DeleteItemButton name={item.name} warning={warning} disabled={isDeleting} onConfirm={() => onDelete(item.id)} />
    </div>
  );
}

export function SimpleReferenceItemsList({
  items,
  addLabel = "Додати значення",
  createDefaultName = "Нове значення",
  emptyHint = "Значень ще немає — натисніть «Додати значення»",
  deleteWarning,
  onCreate,
  onUpdate,
  onDelete,
}: {
  items: SimpleItem[];
  addLabel?: string;
  createDefaultName?: string;
  emptyHint?: string;
  deleteWarning?: string;
  onCreate: (name: string) => Promise<unknown>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleCreate() {
    setActionError(null);
    setIsCreating(true);
    startTransition(async () => {
      try {
        await onCreate(createDefaultName);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося створити");
      } finally {
        setIsCreating(false);
      }
    });
  }

  function handleDelete(id: string) {
    setActionError(null);
    setPendingDeleteId(id);
    startTransition(async () => {
      try {
        await onDelete(id);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Значення цього довідника — використовуються у формі товару.
        </p>
        <Button onClick={handleCreate} disabled={isCreating}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="gap-0 py-2">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              warning={deleteWarning}
              onUpdate={onUpdate}
              onDelete={handleDelete}
              isDeleting={pendingDeleteId === item.id}
            />
          ))}
          {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyHint}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
