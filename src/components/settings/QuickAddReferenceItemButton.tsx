"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { ReferenceItemKind } from "@/lib/constants/reference-item-kinds";
import { createReferenceItemAction } from "@/app/settings/references/[kind]/actions";

type QuickAddSource = { type: "reference-item"; kind: ReferenceItemKind };

// "+Додати" прямо на плитці «Довідники» — для kind-довідників (reference_items:
// Тип тканини/Виробники/Країни/Одиниці виміру), без переходу зі сторінки.
export function QuickAddReferenceItemButton({ source }: { source: QuickAddSource }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await createReferenceItemAction(source.kind, "Нове значення");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-border px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-50"
    >
      <Plus className="size-3" />
      Додати
    </button>
  );
}
