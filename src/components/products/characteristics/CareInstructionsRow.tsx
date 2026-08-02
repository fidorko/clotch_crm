"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCareInstructionIcon } from "@/lib/constants/care-instruction-icons";
import type { CareInstructionRow } from "@/server/data/care-instructions";

/**
 * Множинний вибір (на відміну від решти динамічних характеристик, здебільшого
 * однозначних) — товар може мати кілька пунктів догляду одразу (температура,
 * ручне/машинне прання, прасування тощо), узгоджено з людиною.
 */
export function CareInstructionsRow({
  label,
  careInstructions,
  selectedIds,
  onChange,
}: {
  label: string;
  careInstructions: CareInstructionRow[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const selectedRows = careInstructions.filter((row) => selectedIds.includes(row.id));

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  }

  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-transparent px-1.5 py-1 hover:border-input hover:bg-accent/50 data-popup-open:border-input">
          {selectedRows.length === 0 ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            selectedRows.map((row) => {
              const Icon = getCareInstructionIcon(row.icon);
              return (
                <Tooltip key={row.id}>
                  <TooltipTrigger render={<span className="flex items-center text-foreground" />}>
                    <Icon className="size-4.5" />
                  </TooltipTrigger>
                  <TooltipContent>{row.name}</TooltipContent>
                </Tooltip>
              );
            })
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {careInstructions.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Довідник порожній</div>
            ) : (
              careInstructions.map((row) => {
                const Icon = getCareInstructionIcon(row.icon);
                return (
                  <DropdownMenuCheckboxItem
                    key={row.id}
                    checked={selectedIds.includes(row.id)}
                    onCheckedChange={() => toggle(row.id)}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {row.name}
                  </DropdownMenuCheckboxItem>
                );
              })
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
