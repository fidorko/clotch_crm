"use client";

import { ChevronRight, Layers } from "lucide-react";
import { MaterialsFormDialog } from "@/components/settings/MaterialsFormDialog";
import { ReferenceDictionaryFlagsRow } from "@/components/settings/ReferenceDictionaryFlagsRow";
import type { MaterialRow } from "@/server/data/materials";
import type { DictionaryFlags } from "@/server/data/reference-dictionary-flags";

const MAX_VISIBLE_VALUES = 7;

/** Плитка «Матеріали» — заголовок відкриває попап (MaterialsFormDialog), той самий патерн, що ColorsTile. Раніше — згорнута секція всередині попапу «Тип тканини та матеріал», розділено за прямою вказівкою людини. */
export function MaterialsTile({ materials, flags }: { materials: MaterialRow[]; flags: DictionaryFlags }) {
  const visible = materials.slice(0, MAX_VISIBLE_VALUES);
  const hasMore = materials.length > MAX_VISIBLE_VALUES;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <MaterialsFormDialog
        materials={materials}
        trigger={
          <button type="button" className="flex cursor-pointer items-start gap-3 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Layers className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">Матеріали</span>
              <span className="truncate text-xs text-muted-foreground">Матеріали складу тканини</span>
            </span>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">{materials.length}</span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((material) => (
          <span
            key={material.id}
            className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            <span
              className="size-2 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: material.color ?? "#CCCCCC" }}
            />
            {material.name}
          </span>
        ))}
        {hasMore && (
          <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            …
          </span>
        )}
      </div>

      <ReferenceDictionaryFlagsRow dictionaryKey="materials" flags={flags} />
    </div>
  );
}
