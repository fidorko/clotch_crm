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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CARE_INSTRUCTION_ICON_OPTIONS } from "@/lib/constants/care-instruction-icons";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import {
  createCareInstructionAction,
  deleteCareInstructionAction,
  updateCareInstructionAction,
} from "@/app/settings/references/fabric-materials-actions";

function DeleteCareInstructionButton({
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
        render={<Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити інструкцію ${name}`} />}
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити інструкцію?</DialogTitle>
          <DialogDescription>Інструкцію «{name}» буде видалено з довідника.</DialogDescription>
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

function CareInstructionRowItem({
  instruction,
  onDelete,
  isDeleting,
}: {
  instruction: CareInstructionRow;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(instruction.name);
  const [icon, setIcon] = useState(instruction.icon);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const iconOption = CARE_INSTRUCTION_ICON_OPTIONS.find((o) => o.key === icon) ?? CARE_INSTRUCTION_ICON_OPTIONS[0];

  function save(nextName: string, nextIcon: string) {
    if (nextName === instruction.name && nextIcon === instruction.icon) return;
    setError(null);
    startSaving(async () => {
      try {
        await updateCareInstructionAction(instruction.id, { name: nextName, icon: nextIcon });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти інструкцію");
      }
    });
  }

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(instruction.name);
      return;
    }
    setName(trimmed);
    save(trimmed, icon);
  }

  function commitIcon(nextIcon: string) {
    setIcon(nextIcon);
    save(name, nextIcon);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground">
        <iconOption.icon className="size-4" />
      </span>
      <Select value={icon} onValueChange={(v) => v && commitIcon(v)} disabled={isSaving}>
        <SelectTrigger className="h-8 w-44">
          <SelectValue>{(v: string) => CARE_INSTRUCTION_ICON_OPTIONS.find((o) => o.key === v)?.label ?? v}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CARE_INSTRUCTION_ICON_OPTIONS.map((opt) => (
            <SelectItem key={opt.key} value={opt.key}>
              <span className="flex items-center gap-2">
                <opt.icon className="size-4" />
                {opt.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 flex-1"
        placeholder="Назва інструкції"
        disabled={isSaving}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <DeleteCareInstructionButton name={instruction.name} disabled={isDeleting} onConfirm={() => onDelete(instruction.id)} />
    </div>
  );
}

export function CareInstructionsList({ careInstructions }: { careInstructions: CareInstructionRow[] }) {
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
        await createCareInstructionAction({ name: "Нова інструкція", icon: CARE_INSTRUCTION_ICON_OPTIONS[0].key });
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося створити інструкцію");
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
        await deleteCareInstructionAction(id);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити інструкцію");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Довідник інструкцій по догляду за виробами.</p>
        <Button onClick={handleCreate} disabled={isCreating}>
          <Plus className="size-4" />
          Додати інструкцію
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="gap-0 py-2">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          {careInstructions.map((instruction) => (
            <CareInstructionRowItem
              key={instruction.id}
              instruction={instruction}
              onDelete={handleDelete}
              isDeleting={pendingDeleteId === instruction.id}
            />
          ))}
          {careInstructions.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Інструкцій ще немає — натисніть «Додати інструкцію»
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
