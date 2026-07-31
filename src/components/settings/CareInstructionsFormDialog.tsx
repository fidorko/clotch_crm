"use client";

import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CareInstructionsList } from "@/components/settings/CareInstructionsList";
import type { CareInstructionRow } from "@/server/data/care-instructions";

/** Довідник «Інструкція по догляду» — попап (не окрема сторінка, той самий патерн, що «Кольори»), CareInstructionsList усередині. */
export function CareInstructionsFormDialog({
  trigger,
  careInstructions,
}: {
  trigger: ReactElement;
  careInstructions: CareInstructionRow[];
}) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Інструкція по догляду</DialogTitle>
        </DialogHeader>
        <CareInstructionsList careInstructions={careInstructions} />
      </DialogContent>
    </Dialog>
  );
}
