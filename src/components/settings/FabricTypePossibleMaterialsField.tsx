"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { MaterialRow } from "@/server/data/materials";
import { createMaterialAction } from "@/app/settings/references/fabric-materials/actions";
import { cn } from "@/lib/utils";

/** Чекбокс-грід "Можливі матеріали" + інлайн-створення нового матеріалу (Enter = додати й одразу позначити можливим), той самий тег-патерн, що значення користувацьких характеристик. */
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
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function toggle(id: string) {
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]
    );
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startSaving(async () => {
      try {
        const created = await createMaterialAction({ name, color: null });
        onMaterialsChange([...materials, created]);
        onSelectedIdsChange([...selectedIds, created.id]);
        setNewName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося створити матеріал");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {materials.map((material) => {
          const checked = selectedIds.includes(material.id);
          return (
            <label
              key={material.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                checked ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <Checkbox checked={checked} onCheckedChange={() => toggle(material.id)} />
              {material.color && (
                <span className="size-2.5 shrink-0 rounded-full border border-border" style={{ backgroundColor: material.color }} />
              )}
              {material.name}
            </label>
          );
        })}
        <div className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1">
          <Plus className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Додати"
            disabled={isSaving}
            className="h-6 border-none px-0 shadow-none focus-visible:border-none"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
