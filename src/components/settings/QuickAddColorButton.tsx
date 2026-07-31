"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createColorAction } from "@/app/settings/references/colors/actions";

// Той самий quick-add, що кнопка «Додати колір» на /settings/references/colors
// (плейсхолдер «Новий колір»/#CCCCCC, редагується там), але викликається прямо
// з плитки «Довідники» — без переходу зі сторінки.
export function QuickAddColorButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await createColorAction("Новий колір", "#CCCCCC");
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
