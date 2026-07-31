"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { MATERIAL_CATEGORY_OPTIONS } from "@/lib/constants/fabric-options";
import type { MaterialRow } from "@/server/data/materials";
import { createMaterialAction } from "@/app/settings/references/fabric-materials-actions";

const CREATE_SENTINEL = "__create__";

/**
 * "Можливі матеріали" — пошуковий мультиселект-комбобокс, згрупований за
 * materials.category (7 фіксованих категорій), з інлайн-створенням нового
 * матеріалу, якщо запит не збігається з жодною наявною назвою. Заміняє
 * попередній always-visible чекбокс-грід — не масштабується при десятках
 * матеріалів у довіднику.
 */
export function FabricTypePossibleMaterialsField({
  materials,
  onMaterialsChange,
  selectedIds,
  onSelectedIdsChange,
}: {
  materials: MaterialRow[];
  onMaterialsChange: (next: MaterialRow[]) => void;
  selectedIds: string[];
  onSelectedIdsChange: (next: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const materialById = new Map(materials.map((m) => [m.id, m]));
  const query = inputValue.trim().toLowerCase();
  const hasExactMatch = materials.some((m) => m.name.trim().toLowerCase() === query);

  const groups = MATERIAL_CATEGORY_OPTIONS.map((cat) => ({
    label: cat.label,
    items: materials
      .filter((m) => (m.category ?? "other") === cat.value && !selectedIds.includes(m.id))
      .map((m) => m.id),
  })).filter((g) => g.items.length > 0);

  if (query && !hasExactMatch) {
    groups.push({ label: "", items: [CREATE_SENTINEL] });
  }

  function handleValueChange(nextIds: string[]) {
    if (!nextIds.includes(CREATE_SENTINEL)) {
      onSelectedIdsChange(nextIds);
      return;
    }
    const name = inputValue.trim();
    if (!name) return;
    setError(null);
    startSaving(async () => {
      try {
        const created = await createMaterialAction({ name, color: null });
        onMaterialsChange([...materials, created]);
        onSelectedIdsChange([...nextIds.filter((id) => id !== CREATE_SENTINEL), created.id]);
        setInputValue("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося створити матеріал");
      }
    });
  }

  function removeSelected(id: string) {
    onSelectedIdsChange(selectedIds.filter((v) => v !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <Combobox
        items={groups}
        multiple
        value={selectedIds}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        itemToStringLabel={(id: string) => (id === CREATE_SENTINEL ? inputValue : (materialById.get(id)?.name ?? id))}
        disabled={isSaving}
      >
        <ComboboxInputGroup>
          <ComboboxInput placeholder="Почніть вводити назву матеріалу..." />
          <ComboboxTrigger />
        </ComboboxInputGroup>
        <ComboboxContent>
          {(group: { label: string; items: string[] }) => (
            <ComboboxGroup key={group.label || "create"} items={group.items}>
              {group.label && <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>}
              <ComboboxCollection>
                {(id: string) =>
                  id === CREATE_SENTINEL ? (
                    <ComboboxItem key={id} value={id} className="pl-4 text-primary">
                      <Plus className="size-3.5" />
                      Створити «{inputValue.trim()}»
                    </ComboboxItem>
                  ) : (
                    <ComboboxItem key={id} value={id} className="pl-4">
                      {materialById.get(id)?.color && (
                        <span
                          className="size-2.5 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: materialById.get(id)?.color ?? undefined }}
                        />
                      )}
                      {materialById.get(id)?.name}
                    </ComboboxItem>
                  )
                }
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxContent>
      </Combobox>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => onSelectedIdsChange(materials.map((m) => m.id))}
          className="cursor-pointer text-primary hover:underline"
        >
          Обрати всі
        </button>
        <button
          type="button"
          onClick={() => onSelectedIdsChange([])}
          className="cursor-pointer text-muted-foreground hover:underline"
        >
          Зняти всі
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const material = materialById.get(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm text-foreground"
              >
                {material?.color && (
                  <span className="size-2.5 shrink-0 rounded-full border border-border" style={{ backgroundColor: material.color }} />
                )}
                {material?.name ?? id}
                <button
                  type="button"
                  onClick={() => removeSelected(id)}
                  aria-label={`Прибрати ${material?.name ?? ""}`}
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
