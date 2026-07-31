"use client";

import { ChevronRight, Palette } from "lucide-react";
import { ColorsFormDialog } from "@/components/settings/ColorsFormDialog";
import { ReferenceDictionaryFlagsRow } from "@/components/settings/ReferenceDictionaryFlagsRow";
import type { ColorRow } from "@/server/data/colors";
import type { DictionaryFlags } from "@/server/data/reference-dictionary-flags";

const MAX_VISIBLE_VALUES = 7;

/** Плитка «Кольори» — заголовок відкриває попап (ColorsFormDialog); перемикачі діють прямо тут, без кошика (системний довідник, видалити цілком не можна). */
export function ColorsTile({ colors, flags }: { colors: ColorRow[]; flags: DictionaryFlags }) {
  const visibleColors = colors.slice(0, MAX_VISIBLE_VALUES);
  const hasMore = colors.length > MAX_VISIBLE_VALUES;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <ColorsFormDialog
        colors={colors}
        trigger={
          <button type="button" className="flex cursor-pointer items-start gap-3 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400">
              <Palette className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">Кольори</span>
              <span className="truncate text-xs text-muted-foreground">Кольори та відтінки</span>
            </span>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">{colors.length}</span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {visibleColors.map((color) => (
          <span
            key={color.id}
            className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            <span className="size-2 shrink-0 rounded-full border border-border" style={{ backgroundColor: color.hex }} />
            {color.name}
          </span>
        ))}
        {hasMore && (
          <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            …
          </span>
        )}
      </div>

      <ReferenceDictionaryFlagsRow dictionaryKey="colors" flags={flags} />
    </div>
  );
}
