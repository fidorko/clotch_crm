"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { EditableTextRow } from "@/components/ui/editable-text-row";

export interface TypeGroup {
  id: string;
  name: string;
  values: string[];
}

function DeleteTypeButton({ name, onConfirm, disabled }: { name: string; onConfirm: () => void; disabled: boolean }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити тип ${name}`} />}>
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити тип?</DialogTitle>
          <DialogDescription>Тип «{name}» і всі його значення буде видалено.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
          <DialogClose render={<Button type="button" variant="destructive" onClick={onConfirm} />}>Видалити</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TypeGroupCard({
  group,
  valuesPlaceholder,
  onSave,
  onDelete,
  isDeleting,
}: {
  group: TypeGroup;
  valuesPlaceholder: string;
  onSave: (name: string, values: string[]) => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [valueDraft, setValueDraft] = useState("");
  const [isSaving, startSaving] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function save(nextName: string, nextValues: string[]) {
    setError(null);
    startSaving(async () => {
      try {
        await Promise.resolve(onSave(nextName, nextValues));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти");
      }
    });
  }

  function renameGroup(nextName: string) {
    const trimmed = nextName.trim();
    if (trimmed && trimmed !== group.name) save(trimmed, group.values);
  }

  function addValue() {
    const trimmed = valueDraft.trim();
    setValueDraft("");
    if (!trimmed || group.values.includes(trimmed)) return;
    save(group.name, [...group.values, trimmed]);
  }

  function removeValue(value: string) {
    save(
      group.name,
      group.values.filter((v) => v !== value)
    );
  }

  function handleValueKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue();
    }
  }

  return (
    <Card className="gap-2 py-3">
      <CardContent className="flex flex-col gap-2 px-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <EditableTextRow value={group.name} onChange={renameGroup} placeholder="Назва типу" />
          </div>
          <DeleteTypeButton name={group.name} disabled={isDeleting} onConfirm={onDelete} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {group.values.map((value) => (
            <Badge key={value} variant="outline" className="gap-1 pr-1.5">
              {value}
              <button
                type="button"
                aria-label={`Прибрати значення ${value}`}
                className="cursor-pointer rounded-full hover:bg-muted"
                onClick={() => removeValue(value)}
                disabled={isSaving}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={valueDraft}
          onChange={(e) => setValueDraft(e.target.value)}
          onKeyDown={handleValueKeyDown}
          onBlur={addValue}
          placeholder={valuesPlaceholder}
          className="h-8"
          disabled={isSaving}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

/** Спільний редактор «тип → список значень» — використовується і для «Розміри», і для «Заміри» (той самий патерн, різні Server Actions). */
export function TypeValuesEditor({
  groups,
  addLabel,
  newTypeName,
  valuesPlaceholder,
  emptyText,
  onCreate,
  onUpdate,
  onDelete,
}: {
  groups: TypeGroup[];
  addLabel: string;
  newTypeName: string;
  valuesPlaceholder: string;
  emptyText: string;
  onCreate: () => Promise<unknown>;
  onUpdate: (id: string, name: string, values: string[]) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleCreate() {
    setActionError(null);
    setIsCreating(true);
    startTransition(async () => {
      try {
        await onCreate();
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося створити тип");
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
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити тип");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{newTypeName}</p>
        <Button onClick={handleCreate} disabled={isCreating} size="sm">
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="flex flex-col gap-2">
        {groups.map((group) => (
          <TypeGroupCard
            key={group.id}
            group={group}
            valuesPlaceholder={valuesPlaceholder}
            onSave={(name, values) => onUpdate(group.id, name, values)}
            onDelete={() => handleDelete(group.id)}
            isDeleting={pendingDeleteId === group.id}
          />
        ))}
        {groups.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyText}</p>}
      </div>
    </div>
  );
}
