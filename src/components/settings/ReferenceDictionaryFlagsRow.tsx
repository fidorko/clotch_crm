"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DICTIONARY_FLAG_DEFS, DictionaryFlagToggle, type DictionaryFlagKey } from "@/components/settings/DictionaryFlagToggle";
import type { DictionaryFlags } from "@/server/data/reference-dictionary-flags";
import { updateDictionaryFlagsAction } from "@/app/settings/references/dictionary-flags-actions";

/** Рядок 3 перемикачів (CRM/вітрина/фільтри) прямо на плитці довідника, що не є custom_characteristics — «Кольори», «Тип тканини та матеріал». */
export function ReferenceDictionaryFlagsRow({
  dictionaryKey,
  flags,
}: {
  dictionaryKey: string;
  flags: DictionaryFlags;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingFlag, setPendingFlag] = useState<DictionaryFlagKey | null>(null);

  function toggleFlag(key: DictionaryFlagKey) {
    setPendingFlag(key);
    startTransition(async () => {
      try {
        await updateDictionaryFlagsAction(dictionaryKey, { [key]: !flags[key] });
        router.refresh();
      } finally {
        setPendingFlag(null);
      }
    });
  }

  return (
    <div className="flex items-center gap-1 border-t border-border pt-2">
      {DICTIONARY_FLAG_DEFS.map((flag) => (
        <DictionaryFlagToggle
          key={flag.key}
          icon={flag.icon}
          label={flag.label}
          active={flags[flag.key]}
          disabled={pendingFlag === flag.key}
          onToggle={() => toggleFlag(flag.key)}
        />
      ))}
    </div>
  );
}
