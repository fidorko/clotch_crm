"use client";

import { Upload } from "lucide-react";
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

// Заглушка: сам імпорт (розбір CSV/XLSX, мапінг колонок, пакетний запис) — окрема задача.
export function ImportProductsButton() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="size-4" />
        Імпорт
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Імпорт товарів</DialogTitle>
          <DialogDescription>
            Імпорт із файлу (CSV/XLSX) ще не реалізовано — з&apos;явиться окремою задачею.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Зрозуміло</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
