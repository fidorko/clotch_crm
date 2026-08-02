"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MaterialsManager } from "@/components/settings/MaterialsManager";
import type { MaterialRow } from "@/server/data/materials";

/** Попап «Матеріали» — повний CRUD (MaterialsManager), тепер окремою плиткою, не згорнутою секцією всередині попапу типу тканини. */
export function MaterialsFormDialog({
  trigger,
  materials,
}: {
  trigger: ReactElement;
  materials: MaterialRow[];
}) {
  const [localMaterials, setLocalMaterials] = useState(materials);

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Матеріали</DialogTitle>
        </DialogHeader>
        <MaterialsManager materials={localMaterials} onMaterialsChange={setLocalMaterials} />
      </DialogContent>
    </Dialog>
  );
}
