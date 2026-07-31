"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MaterialRow } from "@/server/data/materials";

export interface CompositionRow {
  materialId: string;
  percent: number;
}

/** "Типовий склад" — матеріал + типовий відсоток; підказка при створенні товару, сума 100% не валідується жорстко (лише орієнтир). */
export function FabricTypeCompositionEditor({
  composition,
  onChange,
  materials,
}: {
  composition: CompositionRow[];
  onChange: (next: CompositionRow[]) => void;
  materials: MaterialRow[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [pendingMaterialId, setPendingMaterialId] = useState("");

  const usedIds = new Set(composition.map((c) => c.materialId));
  const availableMaterials = materials.filter((m) => !usedIds.has(m.id));
  const materialById = new Map(materials.map((m) => [m.id, m]));

  function addRow() {
    if (!pendingMaterialId) return;
    onChange([...composition, { materialId: pendingMaterialId, percent: 0 }]);
    setPendingMaterialId("");
    setIsAdding(false);
  }

  function updatePercent(materialId: string, percent: number) {
    onChange(composition.map((c) => (c.materialId === materialId ? { ...c, percent } : c)));
  }

  function removeRow(materialId: string) {
    onChange(composition.filter((c) => c.materialId !== materialId));
  }

  return (
    <div className="flex flex-col gap-2">
      {composition.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-md border border-border">
          {composition.map((row) => {
            const material = materialById.get(row.materialId);
            return (
              <div key={row.materialId} className="flex items-center gap-2 px-3 py-2">
                {material?.color && (
                  <span className="size-2.5 shrink-0 rounded-full border border-border" style={{ backgroundColor: material.color }} />
                )}
                <span className="flex-1 truncate text-sm text-foreground">{material?.name ?? "—"}</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={row.percent}
                  onChange={(e) => updatePercent(row.materialId, Number(e.target.value))}
                  className="h-7 w-16 text-right"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <button
                  type="button"
                  onClick={() => removeRow(row.materialId)}
                  aria-label={`Прибрати ${material?.name ?? ""} зі складу`}
                  className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isAdding ? (
        <div className="flex items-center gap-2">
          <Select value={pendingMaterialId} onValueChange={(v) => v && setPendingMaterialId(v)}>
            <SelectTrigger className="h-8 flex-1">
              <SelectValue>{(v: string) => materialById.get(v)?.name ?? "Оберіть матеріал"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableMaterials.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={addRow} disabled={!pendingMaterialId} className="cursor-pointer">
            Додати
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => {
              setIsAdding(false);
              setPendingMaterialId("");
            }}
          >
            Скасувати
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          disabled={availableMaterials.length === 0}
          className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-50"
        >
          <Plus className="size-3" />
          Додати матеріал до складу
        </button>
      )}
    </div>
  );
}
