"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Іконка кошика + Dialog-підтвердження перед видаленням. Той самий патерн, що
 * DeleteSkuButton/DeleteColorButton/DeleteSizeButton у ProductSkuTable — там
 * лишений як є (не займали робочий код без потреби), тут — спільна версія
 * для нових місць (фото товару/SKU).
 */
export function ConfirmDeleteIconButton({
  ariaLabel,
  title,
  description,
  onConfirm,
  className,
}: {
  ariaLabel: string;
  title: string;
  description: string;
  onConfirm: () => void;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={<button type="button" aria-label={ariaLabel} className={cn("shrink-0", className)} />}
      >
        <Trash2 className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
          <DialogClose render={<Button type="button" variant="destructive" onClick={onConfirm} />}>
            Видалити
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
