"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { FabricTypeFormDialog } from "@/components/settings/FabricTypeFormDialog";
import { FabricTypesTab } from "@/components/settings/FabricTypesTab";
import { MaterialsTab } from "@/components/settings/MaterialsTab";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";

export function FabricMaterialsWorkspace({
  fabricTypes,
  materials,
  careInstructions,
}: {
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  careInstructions: CareInstructionRow[];
}) {
  const [tab, setTab] = useState<"types" | "materials">("types");

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/settings" className="hover:text-foreground">
              Налаштування
            </Link>
            <span>/</span>
            <Link href="/settings?tab=references" className="hover:text-foreground">
              Довідники
            </Link>
            <span>/</span>
            <span className="text-foreground">Текстильні матеріали</span>
          </nav>
          <HeaderActions />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-foreground">Текстильні матеріали</h1>
            <p className="text-sm text-muted-foreground">
              Керуйте типами тканин та матеріалами, їх складом і властивостями
            </p>
          </div>
          {tab === "types" ? (
            <FabricTypeFormDialog
              trigger={
                <Button className="cursor-pointer">
                  <Plus className="size-4" />
                  Додати тип тканини
                </Button>
              }
              materials={materials}
              careInstructions={careInstructions}
            />
          ) : null}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as "types" | "materials")}>
        <TabsList>
          <TabsTrigger value="types" className="cursor-pointer">
            Типи тканини
          </TabsTrigger>
          <TabsTrigger value="materials" className="cursor-pointer">
            Матеріали
          </TabsTrigger>
        </TabsList>
        <TabsContent value="types">
          <FabricTypesTab fabricTypes={fabricTypes} materials={materials} careInstructions={careInstructions} />
        </TabsContent>
        <TabsContent value="materials">
          <MaterialsTab materials={materials} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
