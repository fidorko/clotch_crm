"use client";

import { Plus, Printer, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COLOR_OPTIONS, SIZE_OPTIONS, type ColorOption } from "@/lib/constants/sku-variant-options";
import type { ProductSku } from "@/lib/types/product";
import type { SkuColor } from "@/components/products/ProductSkuSection";

function DeleteSkuButton({ code, onConfirm }: { code: string; onConfirm: () => void }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Видалити SKU ${code}`}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити SKU?</DialogTitle>
          <DialogDescription>
            SKU «{code}» буде видалено. Цю дію не можна скасувати.
          </DialogDescription>
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

const ADD_TRIGGER_CLASS =
  "flex items-center gap-1 text-xs font-normal text-primary hover:underline";

function AddColorControl({
  options,
  onAdd,
}: {
  options: ColorOption[];
  onAdd: (color: ColorOption) => void;
}) {
  if (options.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={ADD_TRIGGER_CLASS}>
        <Plus className="size-3" />
        Колір
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {options.map((color) => (
          <DropdownMenuItem key={color.name} onClick={() => onAdd(color)}>
            <span
              className="size-3 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
            />
            {color.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddSizeControl({
  options,
  onAdd,
}: {
  options: string[];
  onAdd: (size: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={ADD_TRIGGER_CLASS}>
        <Plus className="size-3" />
        Розмір
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-24">
        {options.map((size) => (
          <DropdownMenuItem key={size} onClick={() => onAdd(size)}>
            {size}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductSkuTable({
  colors,
  sizes,
  skus,
  selectedSkuId,
  onSelect,
  onAddColor,
  onAddSize,
  onAddSku,
  onDeleteSku,
  onAutoGenerate,
}: {
  colors: SkuColor[];
  sizes: string[];
  skus: ProductSku[];
  selectedSkuId?: string;
  onSelect: (skuId: string) => void;
  onAddColor: (color: ColorOption) => void;
  onAddSize: (size: string) => void;
  onAddSku: (color: SkuColor, size: string) => void;
  onDeleteSku: (skuId: string) => void;
  onAutoGenerate: () => void;
}) {
  const skuByColorSize = new Map(skus.map((sku) => [`${sku.color}__${sku.size}`, sku]));
  const remainingColors = COLOR_OPTIONS.filter((c) => !colors.some((added) => added.name === c.name));
  const remainingSizes = SIZE_OPTIONS.filter((s) => !sizes.includes(s));
  const hasAddSizeColumn = remainingSizes.length > 0;

  const gridCell = "border border-border";

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between px-4">
        <CardTitle className="text-sm font-medium">Варіанти (SKU)</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAutoGenerate}>
            Автогенерація SKU
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="size-3.5" />
            Друк всіх SKU
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="overflow-x-auto">
          <Table className="w-auto border-collapse">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={gridCell}>Колір \ Розмір</TableHead>
                {sizes.map((size) => (
                  <TableHead key={size} className={cn(gridCell, "text-center")}>
                    {size}
                  </TableHead>
                ))}
                {hasAddSizeColumn && (
                  <TableHead className={cn(gridCell, "text-center")}>
                    <AddSizeControl options={remainingSizes} onAdd={onAddSize} />
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {colors.map((color) => (
                <TableRow key={color.id} className="hover:bg-transparent">
                  <TableCell className={gridCell}>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3.5 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </div>
                  </TableCell>
                  {sizes.map((size) => {
                    const sku = skuByColorSize.get(`${color.name}__${size}`);
                    if (!sku) {
                      return (
                        <TableCell key={size} className={cn(gridCell, "p-1 text-center")}>
                          <button
                            type="button"
                            aria-label={`Додати SKU: ${color.name} ${size}`}
                            onClick={() => onAddSku(color, size)}
                            className="flex w-full items-center justify-center rounded-md py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={size} className={cn(gridCell, "p-1 text-center")}>
                        <div
                          className={cn(
                            "flex items-start gap-1 rounded-md px-2 py-1.5 transition-colors",
                            sku.id === selectedSkuId ? "bg-accent" : "hover:bg-accent/60"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onSelect(sku.id)}
                            className="flex-1 text-left text-xs"
                          >
                            <div className="font-medium text-foreground">{sku.code}</div>
                            <div className="text-muted-foreground">ШК: {sku.barcode || "—"}</div>
                            <div className="text-muted-foreground">Комірка: {sku.cell || "—"}</div>
                          </button>
                          <DeleteSkuButton code={sku.code} onConfirm={() => onDeleteSku(sku.id)} />
                        </div>
                      </TableCell>
                    );
                  })}
                  {hasAddSizeColumn && <TableCell className={gridCell} />}
                </TableRow>
              ))}
              {remainingColors.length > 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell className={gridCell}>
                    <AddColorControl options={remainingColors} onAdd={onAddColor} />
                  </TableCell>
                  {sizes.map((size) => (
                    <TableCell key={size} className={gridCell} />
                  ))}
                  {hasAddSizeColumn && <TableCell className={gridCell} />}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
