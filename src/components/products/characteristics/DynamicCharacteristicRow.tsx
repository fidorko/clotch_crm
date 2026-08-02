"use client";

import { EditableIdSelectRow } from "@/components/ui/editable-id-select-row";
import { CareInstructionsRow } from "@/components/products/characteristics/CareInstructionsRow";
import { TagsRow } from "@/components/products/characteristics/TagsRow";
import {
  MaterialCompositionRow,
  type MaterialCompositionEntry,
} from "@/components/products/characteristics/MaterialCompositionRow";
import type { ResolvedCharacteristicRow } from "@/lib/products/characteristic-layout";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";

/**
 * Рендерить один рядок динамічної характеристики за її ключем: "fabric-materials"
 * і "care-instructions" мають особливу форму (склад тканини з %, множинний
 * вибір догляду), решта (довільні custom-характеристики, Виробник, Країна) —
 * звичайний однозначний select. Той самий набір ключів і в ProductInfoPanel,
 * і в ProductMetaPanel — рядок може опинитись у будь-якій панелі (layout).
 */
export function DynamicCharacteristicRow({
  row,
  characteristics,
  onCharacteristicChange,
  careInstructions,
  fabricTypes,
  materials,
  materialComposition,
  onMaterialCompositionChange,
  tagsKey,
  tags,
  onTagsChange,
}: {
  row: ResolvedCharacteristicRow;
  characteristics: Record<string, string[]>;
  onCharacteristicChange: (key: string, valueIds: string[]) => void;
  careInstructions: CareInstructionRow[];
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  materialComposition: MaterialCompositionEntry[];
  onMaterialCompositionChange: (entries: MaterialCompositionEntry[]) => void;
  tagsKey: string | null;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}) {
  const selectedIds = characteristics[row.key] ?? [];

  if (tagsKey && row.key === tagsKey) {
    return (
      <TagsRow label={row.option.label} availableTags={row.option.values} tags={tags} onChange={onTagsChange} />
    );
  }

  if (row.key === "fabric-materials") {
    return (
      <MaterialCompositionRow
        label={row.option.label}
        fabricTypeOptions={row.option.values}
        fabricTypes={fabricTypes}
        materials={materials}
        fabricTypeId={selectedIds[0] ?? ""}
        onFabricTypeChange={(id) => onCharacteristicChange(row.key, id ? [id] : [])}
        composition={materialComposition}
        onCompositionChange={onMaterialCompositionChange}
      />
    );
  }

  if (row.key === "care-instructions") {
    return (
      <CareInstructionsRow
        label={row.option.label}
        careInstructions={careInstructions}
        selectedIds={selectedIds}
        onChange={(ids) => onCharacteristicChange(row.key, ids)}
      />
    );
  }

  return (
    <EditableIdSelectRow
      label={row.option.label}
      value={selectedIds[0] ?? ""}
      options={row.option.values}
      onChange={(id) => onCharacteristicChange(row.key, id ? [id] : [])}
    />
  );
}
