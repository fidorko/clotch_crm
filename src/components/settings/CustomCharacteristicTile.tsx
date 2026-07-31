"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { ConfirmDeleteIconButton } from "@/components/ui/confirm-delete-button";
import { CustomCharacteristicFormDialog } from "@/components/settings/CustomCharacteristicFormDialog";
import { DICTIONARY_FLAG_DEFS, DictionaryFlagToggle, type DictionaryFlagKey } from "@/components/settings/DictionaryFlagToggle";
import type { CustomCharacteristicWithValues } from "@/server/data/custom-characteristics";
import {
  deleteCustomCharacteristicAction,
  updateCustomCharacteristicFlagsAction,
} from "@/app/settings/references/custom/actions";

const MAX_VISIBLE_VALUES = 7;

/**
 * Плитка користувацької характеристики — заголовок відкриває попап
 * редагування (назва/значення), але перемикачі (CRM/вітрина/фільтри) й
 * видалення діють прямо тут, без відкриття попапу (за прямою вказівкою).
 */
export function CustomCharacteristicTile({ characteristic }: { characteristic: CustomCharacteristicWithValues }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingFlag, setPendingFlag] = useState<DictionaryFlagKey | null>(null);

  const visibleValues = characteristic.values.slice(0, MAX_VISIBLE_VALUES);
  const hasMore = characteristic.values.length > MAX_VISIBLE_VALUES;

  function toggleFlag(key: DictionaryFlagKey) {
    setPendingFlag(key);
    startTransition(async () => {
      try {
        await updateCustomCharacteristicFlagsAction(characteristic.id, { [key]: !characteristic[key] });
        router.refresh();
      } finally {
        setPendingFlag(null);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCustomCharacteristicAction(characteristic.id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <CustomCharacteristicFormDialog
        characteristic={characteristic}
        trigger={
          <button type="button" className="flex cursor-pointer items-start gap-3 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <Sparkles className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{characteristic.name}</span>
              <span className="truncate text-xs text-muted-foreground">Власна характеристика товару</span>
            </span>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {characteristic.values.length}
            </span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {visibleValues.map((value) => (
          <span
            key={value.id}
            className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            {value.value}
          </span>
        ))}
        {hasMore && (
          <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            …
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <div className="flex items-center gap-1">
          {DICTIONARY_FLAG_DEFS.map((flag) => (
            <DictionaryFlagToggle
              key={flag.key}
              icon={flag.icon}
              label={flag.label}
              active={characteristic[flag.key]}
              disabled={pendingFlag === flag.key}
              onToggle={() => toggleFlag(flag.key)}
            />
          ))}
        </div>
        <ConfirmDeleteIconButton
          ariaLabel={`Видалити довідник ${characteristic.name}`}
          title="Видалити довідник?"
          description={`«${characteristic.name}» і всі її значення (${characteristic.values.length}) буде видалено безповоротно.`}
          onConfirm={handleDelete}
          className="cursor-pointer rounded p-1.5 text-muted-foreground hover:text-destructive"
        />
      </div>
    </div>
  );
}
