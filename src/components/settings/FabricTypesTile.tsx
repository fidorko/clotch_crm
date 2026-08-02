"use client";

import { ChevronRight, Plus, Scissors } from "lucide-react";
import { FabricTypeFormDialog } from "@/components/settings/FabricTypeFormDialog";
import { ReferenceDictionaryFlagsRow } from "@/components/settings/ReferenceDictionaryFlagsRow";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import type { DictionaryFlags } from "@/server/data/reference-dictionary-flags";

const MAX_VISIBLE_VALUES = 7;

const CHIP_CLASS =
  "inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary";
const ADD_CHIP_CLASS =
  "inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-border px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary";

/**
 * Плитка «Тип тканини» — немає окремої сторінки (decisions.md), усе
 * керується попапами прямо звідси: заголовок і чіп кожного наявного типу
 * відкривають `FabricTypeFormDialog` (заголовок — режим create, чіп — edit),
 * «+Додати» в рядку чіпів — той самий create. Заголовок клікабельний, як і на
 * решті плиток («Кольори»/`ReferenceTile`), а не статичний текст.
 * «Матеріали» — раніше згорнута секція в цьому ж попапі, тепер окрема плитка
 * (`MaterialsTile`) — `materials` тут лишається лише для селектора «Можливі
 * матеріали» всередині `FabricTypeFormDialog`, довідник ключа `fabric-materials`
 * (dictionaryKey не міняли — лише лейбл, характеристика картки товару
 * лишається тим самим ключем, decisions.md).
 */
export function FabricTypesTile({
  fabricTypes,
  materials,
  flags,
}: {
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  flags: DictionaryFlags;
}) {
  const visible = fabricTypes.slice(0, MAX_VISIBLE_VALUES);
  const hasMore = fabricTypes.length > MAX_VISIBLE_VALUES;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <FabricTypeFormDialog
        materials={materials}
        trigger={
          <button type="button" className="flex cursor-pointer items-start gap-3 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <Scissors className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">Тип тканини</span>
              <span className="truncate text-xs text-muted-foreground">Типи тканин виробів</span>
            </span>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">{fabricTypes.length}</span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((fabricType) => (
          <FabricTypeFormDialog
            key={fabricType.id}
            trigger={<button type="button" className={CHIP_CLASS}>{fabricType.name}</button>}
            fabricType={fabricType}
            materials={materials}
          />
        ))}
        {hasMore && (
          <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            …
          </span>
        )}
        <FabricTypeFormDialog
          trigger={
            <button type="button" className={ADD_CHIP_CLASS}>
              <Plus className="size-3" />
              Додати
            </button>
          }
          materials={materials}
        />
      </div>

      <ReferenceDictionaryFlagsRow dictionaryKey="fabric-materials" flags={flags} />
    </div>
  );
}
