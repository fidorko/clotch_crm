"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CARE_INSTRUCTION_ICON_OPTIONS, getCareInstructionIcon } from "@/lib/constants/care-instruction-icons";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import { createCareInstructionAction } from "@/app/settings/references/fabric-materials/actions";
import { cn } from "@/lib/utils";

/**
 * Чекбокс-список "Рекомендації по догляду" + інлайн створення нового запису
 * (назва + вибір іконки з фіксованого набору-кандидатів) прямо тут, без виходу
 * з форми типу тканини — щойно створений запис одразу зʼявляється в списку
 * й позначається вибраним.
 */
export function FabricTypeCareInstructionsField({
  careInstructions,
  onCareInstructionsChange,
  selectedIds,
  onSelectedIdsChange,
}: {
  careInstructions: CareInstructionRow[];
  onCareInstructionsChange: (next: CareInstructionRow[]) => void;
  selectedIds: string[];
  onSelectedIdsChange: (next: string[]) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function toggle(id: string) {
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]
    );
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) {
      setError("Вкажіть назву");
      return;
    }
    if (!newIcon) {
      setError("Оберіть іконку");
      return;
    }
    setError(null);
    startSaving(async () => {
      try {
        const created = await createCareInstructionAction({ name, icon: newIcon });
        onCareInstructionsChange([...careInstructions, created]);
        onSelectedIdsChange([...selectedIds, created.id]);
        setNewName("");
        setNewIcon(null);
        setIsAdding(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося створити інструкцію");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {careInstructions.map((item) => {
          const Icon = getCareInstructionIcon(item.icon);
          const checked = selectedIds.includes(item.id);
          return (
            <label
              key={item.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                checked ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <Checkbox checked={checked} onCheckedChange={() => toggle(item.id)} />
              <Icon className="size-4 shrink-0" />
              {item.name}
            </label>
          );
        })}
      </div>

      {isAdding ? (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Напр. Прання при 30°C"
            disabled={isSaving}
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            {CARE_INSTRUCTION_ICON_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                title={opt.label}
                onClick={() => setNewIcon(opt.key)}
                disabled={isSaving}
                className={cn(
                  "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
                  newIcon === opt.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <opt.icon className="size-4" />
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={handleCreate} disabled={isSaving} className="cursor-pointer">
              Створити
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="cursor-pointer"
              disabled={isSaving}
              onClick={() => {
                setIsAdding(false);
                setNewName("");
                setNewIcon(null);
                setError(null);
              }}
            >
              Скасувати
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-3" />
          Додати інструкцію
        </button>
      )}
    </div>
  );
}
