"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { ReferenceItemKind } from "@/lib/constants/reference-item-kinds";
import { createReferenceItemAction } from "@/app/settings/references/[kind]/actions";
import { createTagAction } from "@/app/settings/references/tags/actions";

type QuickAddSource = { type: "reference-item"; kind: ReferenceItemKind } | { type: "tag" };

// "+Додати" прямо на плитці «Довідники» — для kind-довідників (reference_items)
// і для тегів (окрема таблиця tags), без переходу зі сторінки.
export function QuickAddReferenceItemButton({ source }: { source: QuickAddSource }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      if (source.type === "tag") {
        await createTagAction("новий-тег");
      } else {
        await createReferenceItemAction(source.kind, "Нове значення");
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
    >
      <Plus className="size-3" />
      Додати
    </button>
  );
}
