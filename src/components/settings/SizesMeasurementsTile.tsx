"use client";

import { ChevronRight, Ruler } from "lucide-react";
import { SizesMeasurementsFormDialog } from "@/components/settings/SizesMeasurementsFormDialog";
import { ReferenceDictionaryFlagsRow } from "@/components/settings/ReferenceDictionaryFlagsRow";
import type { SizeTypeWithValues } from "@/server/data/size-types";
import type { MeasurementTypeWithValues } from "@/server/data/measurement-types";
import type { DictionaryFlags } from "@/server/data/reference-dictionary-flags";

const MAX_VISIBLE_VALUES = 7;

/** Плитка «Розміри та заміри» — заголовок відкриває попап (2 вкладки: Розміри/Заміри), той самий патерн, що ColorsTile. Чіпи прев'ю — назви типів з обох довідників разом. */
export function SizesMeasurementsTile({
  sizeTypes,
  measurementTypes,
  flags,
}: {
  sizeTypes: SizeTypeWithValues[];
  measurementTypes: MeasurementTypeWithValues[];
  flags: DictionaryFlags;
}) {
  const totalTypes = sizeTypes.length + measurementTypes.length;
  const previewNames = [...sizeTypes.map((t) => t.name), ...measurementTypes.map((t) => t.name)];
  const visible = previewNames.slice(0, MAX_VISIBLE_VALUES);
  const hasMore = previewNames.length > MAX_VISIBLE_VALUES;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <SizesMeasurementsFormDialog
        sizeTypes={sizeTypes}
        measurementTypes={measurementTypes}
        trigger={
          <button type="button" className="flex cursor-pointer items-start gap-3 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Ruler className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">Розміри та заміри</span>
              <span className="truncate text-xs text-muted-foreground">Типи розмірів і замірів</span>
            </span>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">{totalTypes}</span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            {name}
          </span>
        ))}
        {hasMore && (
          <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            …
          </span>
        )}
      </div>

      <ReferenceDictionaryFlagsRow dictionaryKey="measurements" flags={flags} />
    </div>
  );
}
