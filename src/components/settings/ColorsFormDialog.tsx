"use client";

import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ColorsList } from "@/components/settings/ColorsList";
import type { ColorRow } from "@/server/data/colors";

/** Довідник «Кольори» — попап (не окрема сторінка, за прямою вказівкою), той самий ColorsList усередині. */
export function ColorsFormDialog({ trigger, colors }: { trigger: ReactElement; colors: ColorRow[] }) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Кольори</DialogTitle>
        </DialogHeader>
        <ColorsList colors={colors} />
      </DialogContent>
    </Dialog>
  );
}
