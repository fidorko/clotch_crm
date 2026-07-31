"use client";

import { useState } from "react";
import { FabricTypeDetailPanel } from "@/components/settings/FabricTypeDetailPanel";
import { FabricTypesList } from "@/components/settings/FabricTypesList";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";

export function FabricTypesTab({
  fabricTypes,
  materials,
  careInstructions,
}: {
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  careInstructions: CareInstructionRow[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(fabricTypes[0]?.id ?? null);
  const selected = fabricTypes.find((f) => f.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <FabricTypesList fabricTypes={fabricTypes} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="min-w-0 flex-1">
        {selected ? (
          <FabricTypeDetailPanel
            fabricType={selected}
            materials={materials}
            careInstructions={careInstructions}
            onDeleted={() => setSelectedId(fabricTypes.find((f) => f.id !== selected.id)?.id ?? null)}
          />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Оберіть тип тканини зі списку або додайте новий</p>
          </div>
        )}
      </div>
    </div>
  );
}
