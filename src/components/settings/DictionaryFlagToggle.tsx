"use client";

import { Filter, Laptop, Store, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type DictionaryFlagKey = "showInCrm" | "showOnStorefront" | "participatesInFilters";

export const DICTIONARY_FLAG_DEFS: { key: DictionaryFlagKey; icon: LucideIcon; label: string }[] = [
  { key: "showInCrm", icon: Laptop, label: "Відображати на сторінці товару в CRM" },
  { key: "showOnStorefront", icon: Store, label: "Відображати на сторінці товару на вітрині" },
  { key: "participatesInFilters", icon: Filter, label: "Бере участь у фільтрах" },
];

/** Іконка+Tooltip, активний/неактивний стан — той самий перемикач на плитках довідників і в попапі валют. */
export function DictionaryFlagToggle({
  icon: Icon,
  label,
  active,
  disabled,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-pressed={active}
            aria-label={label}
            className={cn(
              "flex size-7 cursor-pointer items-center justify-center rounded-md border transition-colors disabled:cursor-default disabled:opacity-50",
              active
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          />
        }
      >
        <Icon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
