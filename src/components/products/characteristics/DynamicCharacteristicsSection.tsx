"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { CharacteristicIcon } from "@/lib/categories/characteristic-icons";
import { DynamicCharacteristicRow } from "@/components/products/characteristics/DynamicCharacteristicRow";
import type { MaterialCompositionEntry } from "@/components/products/characteristics/MaterialCompositionRow";
import type { ResolvedCharacteristicRow } from "@/lib/products/characteristic-layout";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";

/**
 * Секція динамічних характеристик усередині ProductInfoPanel/ProductMetaPanel
 * (dropId — "info-panel"/"meta-panel"). У звичайному режимі — інтерактивні
 * рядки (DynamicCharacteristicRow), у режимі "редагувати layout" — тільки
 * назва+іконка, перетягувані між панелями (DndContext — спільний, у
 * ProductGeneralTab, обгортає обидві панелі одразу).
 */
export function DynamicCharacteristicsSection({
  dropId,
  rows,
  layoutEditMode,
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
  dropId: "info-panel" | "meta-panel";
  rows: ResolvedCharacteristicRow[];
  layoutEditMode: boolean;
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
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  if (!layoutEditMode) {
    if (rows.length === 0) return null;
    return (
      <>
        {rows.map((row) => (
          <DynamicCharacteristicRow
            key={row.key}
            row={row}
            characteristics={characteristics}
            onCharacteristicChange={onCharacteristicChange}
            careInstructions={careInstructions}
            fabricTypes={fabricTypes}
            materials={materials}
            materialComposition={row.key === "fabric-materials" ? materialComposition : []}
            onMaterialCompositionChange={onMaterialCompositionChange}
            tagsKey={tagsKey}
            tags={tags}
            onTagsChange={onTagsChange}
          />
        ))}
      </>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-14 flex-col gap-1.5 rounded-lg border border-dashed p-2 transition-colors duration-200",
        isOver ? "border-primary/50 bg-primary/5" : "border-border"
      )}
    >
      <SortableContext items={rows.map((row) => row.key)} strategy={verticalListSortingStrategy}>
        {rows.map((row) => (
          <LayoutDragCard key={row.key} row={row} />
        ))}
      </SortableContext>
      {rows.length === 0 && (
        <p className="py-3 text-center text-xs text-muted-foreground">
          Перетягніть характеристики сюди
        </p>
      )}
    </div>
  );
}

function LayoutDragCard({ row }: { row: ResolvedCharacteristicRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.key,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "flex h-9 cursor-grab items-center gap-2 rounded-md border border-border bg-background px-2 active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />
      <CharacteristicIcon option={row.option} className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate text-sm text-foreground">{row.option.label}</span>
    </div>
  );
}
