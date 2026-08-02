"use client";

import { ChevronRight, Ruler } from "lucide-react";
import { MeasurementTypesFormDialog } from "@/components/settings/MeasurementTypesFormDialog";
import { ReferenceDictionaryFlagsRow } from "@/components/settings/ReferenceDictionaryFlagsRow";
import type { MeasurementTypeWithValues } from "@/server/data/measurement-types";
import type { DictionaryFlags } from "@/server/data/reference-dictionary-flags";

const MAX_VISIBLE_VALUES = 7;

/** Плитка «Заміри» — заголовок відкриває попап, той самий патерн, що ColorsTile. Раніше — частина комбінованої плитки «Розміри та заміри», розділено за прямою вказівкою людини. */
export function MeasurementsTile({
  measurementTypes,
  flags,
}: {
  measurementTypes: MeasurementTypeWithValues[];
  flags: DictionaryFlags;
}) {
  const visible = measurementTypes.slice(0, MAX_VISIBLE_VALUES);
  const hasMore = measurementTypes.length > MAX_VISIBLE_VALUES;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <MeasurementTypesFormDialog
        measurementTypes={measurementTypes}
        trigger={
          <button type="button" className="flex cursor-pointer items-start gap-3 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <Ruler className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">Заміри</span>
              <span className="truncate text-xs text-muted-foreground">Типи замірів товару</span>
            </span>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">{measurementTypes.length}</span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            {t.name}
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
