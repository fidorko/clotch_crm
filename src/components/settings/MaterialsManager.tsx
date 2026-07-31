"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteIconButton } from "@/components/ui/confirm-delete-button";
import { Input } from "@/components/ui/input";
import type { MaterialRow } from "@/server/data/materials";
import {
  createMaterialAction,
  deleteMaterialAction,
  updateMaterialAction,
} from "@/app/settings/references/fabric-materials-actions";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const SWATCH_CLASS =
  "size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none";

function MaterialRowItem({
  material,
  onSave,
  onDelete,
  isDeleting,
}: {
  material: MaterialRow;
  onSave: (id: string, name: string, color: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [name, setName] = useState(material.name);
  const [color, setColor] = useState(material.color ?? "#CCCCCC");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const swatchColor = HEX_RE.test(color) ? color : (material.color ?? "#CCCCCC");

  function save(nextName: string, nextColor: string) {
    if (nextName === material.name && nextColor.toUpperCase() === (material.color ?? "").toUpperCase()) return;
    setError(null);
    startSaving(async () => {
      try {
        await updateMaterialAction(material.id, { name: nextName, color: nextColor });
        onSave(material.id, nextName, nextColor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти матеріал");
      }
    });
  }

  function commitColor(value: string) {
    const normalized = value.trim();
    if (!HEX_RE.test(normalized)) {
      setError("Код кольору має бути у форматі #RRGGBB");
      setColor(material.color ?? "#CCCCCC");
      return;
    }
    setColor(normalized.toUpperCase());
    save(name, normalized);
  }

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(material.name);
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
        aria-label={`Змінити колір-зразок для ${material.name}`}
        className={SWATCH_CLASS}
        disabled={isSaving || isDeleting}
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 flex-1"
        placeholder="Назва матеріалу"
        disabled={isSaving || isDeleting}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <ConfirmDeleteIconButton
        ariaLabel={`Видалити матеріал ${material.name}`}
        title="Видалити матеріал?"
        description={`Матеріал «${material.name}» буде видалено з довідника й прибраний з можливих матеріалів усіх типів тканини, де він використовувався.`}
        onConfirm={() => onDelete(material.id)}
        className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
      />
    </div>
  );
}

/**
 * Повний CRUD довідника матеріалів — раніше окрема вкладка на сторінці, тепер
 * вбудований усередину `FabricTypeFormDialog` (немає більше сторінки "Тип
 * тканини та матеріал", decisions.md). `onMaterialsChange` тримає синхронним
 * `localMaterials` попапу-батька, `router.refresh()` — дані плитки в гріді
 * «Довідники» поза попапом.
 */
export function MaterialsManager({
  materials,
  onMaterialsChange,
}: {
  materials: MaterialRow[];
  onMaterialsChange: (next: MaterialRow[]) => void;
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
        const created = await createMaterialAction({ name: "Новий матеріал", color: "#CCCCCC" });
        onMaterialsChange([...materials, created]);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося створити матеріал");
      } finally {
        setIsCreating(false);
      }
    });
  }

  function handleSave(id: string, name: string, color: string) {
    onMaterialsChange(materials.map((m) => (m.id === id ? { ...m, name, color } : m)));
    router.refresh();
  }

  function handleDelete(id: string) {
    setActionError(null);
    setPendingDeleteId(id);
    startTransition(async () => {
      try {
        await deleteMaterialAction(id);
        onMaterialsChange(materials.filter((m) => m.id !== id));
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити матеріал");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Довідник матеріалів — назва + колір-зразок.</p>
        <Button size="sm" onClick={handleCreate} disabled={isCreating} className="cursor-pointer">
          <Plus className="size-3.5" />
          Додати матеріал
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="max-h-64 gap-0 overflow-y-auto py-2">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          {materials.map((material) => (
            <MaterialRowItem
              key={material.id}
              material={material}
              onSave={handleSave}
              onDelete={handleDelete}
              isDeleting={pendingDeleteId === material.id}
            />
          ))}
          {materials.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Матеріалів ще немає — натисніть «Додати матеріал»
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
