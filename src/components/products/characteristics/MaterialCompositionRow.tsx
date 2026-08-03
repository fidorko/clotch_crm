"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
import { EditableIdSelectRow } from "@/components/ui/editable-id-select-row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";

export interface MaterialCompositionEntry {
  materialId: string;
  percent: number;
}

/**
 * "Тип тканини та матеріал" — окрема форма серед динамічних характеристик
 * (узгоджено з людиною): спершу тип тканини (з закріплених значень
 * категорії), тоді розкладка складу — матеріал (лише з "можливих матеріалів"
 * обраного типу, fabric_type_possible_materials) + %, напр. "бавовна 90%,
 * синтетика 10%". Зміна типу тканини скидає розкладку — матеріали прив'язані
 * до конкретного типу, стара розкладка втрачає сенс.
 */
export function MaterialCompositionRow({
  label,
  fabricTypeOptions,
  fabricTypes,
  materials,
  fabricTypeId,
  onFabricTypeChange,
  composition,
  onCompositionChange,
}: {
  label: string;
  fabricTypeOptions: { id: string; label: string }[];
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  fabricTypeId: string;
  onFabricTypeChange: (id: string) => void;
  composition: MaterialCompositionEntry[];
  onCompositionChange: (entries: MaterialCompositionEntry[]) => void;
}) {
  const fabricType = fabricTypes.find((f) => f.id === fabricTypeId);
  const possibleMaterials = fabricType
    ? materials.filter((m) => fabricType.possibleMaterialIds.includes(m.id))
    : [];
  const totalPercent = composition.reduce((sum, entry) => sum + entry.percent, 0);

  function handleFabricTypeChange(id: string) {
    onFabricTypeChange(id);
    onCompositionChange([]);
  }

  function addRow() {
    const usedIds = new Set(composition.map((c) => c.materialId));
    const nextMaterial = possibleMaterials.find((m) => !usedIds.has(m.id));
    if (!nextMaterial) return;
    onCompositionChange([...composition, { materialId: nextMaterial.id, percent: 0 }]);
  }

  function updateRow(index: number, patch: Partial<MaterialCompositionEntry>) {
    onCompositionChange(composition.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function removeRow(index: number) {
    onCompositionChange(composition.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col py-1.5">
      <EditableIdSelectRow
        label={label}
        value={fabricTypeId}
        options={fabricTypeOptions}
        onChange={handleFabricTypeChange}
      />
      {fabricType && (
        <div className="flex flex-col gap-1.5 pb-1.5 pl-40">
          {composition.map((entry, index) => {
            const usedIds = new Set(composition.map((c) => c.materialId));
            const availableForRow = possibleMaterials.filter(
              (m) => m.id === entry.materialId || !usedIds.has(m.id)
            );
            return (
              <div key={index} className="flex items-center gap-1.5">
                <Select
                  value={entry.materialId}
                  onValueChange={(v) => v && updateRow(index, { materialId: v })}
                >
                  <SelectTrigger size="sm" className="min-w-0 flex-1 justify-between text-sm">
                    <SelectValue className="truncate">
                      {(v: string) => materials.find((m) => m.id === v)?.name ?? "—"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {availableForRow.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DecimalInput
                  value={String(entry.percent)}
                  onChange={(value) => updateRow(index, { percent: value === "" ? 0 : Number(value) })}
                  className="h-7 w-16 px-1.5 text-right text-sm"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Прибрати матеріал"
                  onClick={() => removeRow(index)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            );
          })}
          {possibleMaterials.length > composition.length && (
            <button
              type="button"
              onClick={addRow}
              className="flex w-fit items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="size-3.5" />
              Додати матеріал
            </button>
          )}
          {composition.length > 0 && totalPercent !== 100 && (
            <span className="text-xs text-warning">Разом {totalPercent}% (очікується 100%)</span>
          )}
        </div>
      )}
    </div>
  );
}
