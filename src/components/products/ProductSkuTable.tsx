"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteIconButton } from "@/components/ui/confirm-delete-button";
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
import { deleteColorPhotoAction, uploadColorPhotoAction } from "@/app/products/[id]/actions";
import { MAX_COLOR_PHOTOS } from "@/lib/constants/color-photos";
import type { ColorOption } from "@/lib/constants/sku-variant-options";
import type { ProductPhoto, ProductSku } from "@/lib/types/product";
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

function DeleteColorButton({
  name,
  skuCount,
  onConfirm,
}: {
  name: string;
  skuCount: number;
  onConfirm: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Видалити колір ${name}`}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити колір?</DialogTitle>
          <DialogDescription>
            Колір «{name}»{skuCount > 0 ? ` і ${skuCount} SKU з ним` : ""} буде видалено. Цю дію не
            можна скасувати.
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

function DeleteSizeButton({
  size,
  skuCount,
  onConfirm,
}: {
  size: string;
  skuCount: number;
  onConfirm: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Видалити розмір ${size}`}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити розмір?</DialogTitle>
          <DialogDescription>
            Розмір «{size}»{skuCount > 0 ? ` і ${skuCount} SKU з ним` : ""} буде видалено. Цю дію не
            можна скасувати.
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

function ColorPhotosControl({
  productId,
  color,
  disabled,
  onPhotosChange,
}: {
  productId: string;
  color: SkuColor;
  disabled?: boolean;
  onPhotosChange: (photos: ProductPhoto[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const photos = color.photos;

  function handleFileSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("file", file);
      try {
        const photo = await uploadColorPhotoAction(productId, color.name, fd);
        onPhotosChange([...photos, photo]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося завантажити фото");
      }
    });
  }

  function handleDelete(photoId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteColorPhotoAction(photoId, productId);
        onPhotosChange(photos.filter((p) => p.id !== photoId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося видалити фото");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {photos.map((photo) => (
        <div key={photo.id} className="group relative size-8 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- зберігається поза webroot, next/image не роздає такі шляхи */}
          <img src={photo.url} alt="" className="size-full rounded border border-border object-cover" />
          <ConfirmDeleteIconButton
            ariaLabel={`Видалити фото кольору ${color.name}`}
            title="Видалити фото?"
            description="Фото кольору буде видалено. Цю дію не можна скасувати."
            onConfirm={() => handleDelete(photo.id)}
            className="absolute -top-1.5 -right-1.5 rounded-full bg-background p-0.5 text-muted-foreground opacity-0 shadow-sm ring-1 ring-border transition-opacity group-hover:opacity-100 hover:text-destructive [&_svg]:size-2.5"
          />
        </div>
      ))}
      {photos.length < MAX_COLOR_PHOTOS && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isPending}
          className={cn(ADD_TRIGGER_CLASS, "disabled:opacity-50")}
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <ImageIcon className="size-3" />}
          Додати фото
        </button>
      )}
      {error && <span className="basis-full text-xs text-destructive">{error}</span>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFileSelected(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function ProductSkuTable({
  productId,
  colors,
  colorOptions,
  sizeOptions,
  sizes,
  skus,
  selectedSkuId,
  onSelect,
  onAddColor,
  onAddSize,
  onAddSku,
  onDeleteSku,
  onDeleteColor,
  onDeleteSize,
  onAutoGenerate,
  onColorPhotosChange,
  disabled,
}: {
  productId: string;
  colors: SkuColor[];
  colorOptions: ColorOption[];
  sizeOptions: string[];
  sizes: string[];
  skus: ProductSku[];
  selectedSkuId?: string;
  onSelect: (skuId: string) => void;
  onAddColor: (color: ColorOption) => void;
  onAddSize: (size: string) => void;
  onAddSku: (color: SkuColor, size: string) => void;
  onDeleteSku: (skuId: string) => void;
  onDeleteColor: (colorId: string) => void;
  onDeleteSize: (size: string) => void;
  onAutoGenerate: () => void;
  onColorPhotosChange: (colorId: string, photos: ProductPhoto[]) => void;
  disabled?: boolean;
}) {
  const skuByColorSize = new Map(skus.map((sku) => [`${sku.color}__${sku.size}`, sku]));
  const remainingColors = colorOptions.filter((c) => !colors.some((added) => added.name === c.name));
  const remainingSizes = sizeOptions.filter((s) => !sizes.includes(s));
  const hasAddSizeColumn = remainingSizes.length > 0;
  const canAutoGenerate = colors.length > 0 && sizes.length > 0 && !disabled;

  const gridCell = "border border-border";

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between px-4">
        <CardTitle className="text-sm font-medium">Варіанти (SKU)</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAutoGenerate}
            disabled={!canAutoGenerate}
          >
            Автогенерація SKU
          </Button>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Printer className="size-3.5" />
            Друк всіх SKU
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className={cn("overflow-x-auto", disabled && "pointer-events-none opacity-60")}>
          <Table className="w-auto border-collapse">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={gridCell}>Колір \ Розмір</TableHead>
                {sizes.map((size) => (
                  <TableHead key={size} className={cn(gridCell, "text-center")}>
                    <div className="flex items-center justify-center gap-1">
                      {size}
                      <DeleteSizeButton
                        size={size}
                        skuCount={skus.filter((s) => s.size === size).length}
                        onConfirm={() => onDeleteSize(size)}
                      />
                    </div>
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
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3.5 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                        <DeleteColorButton
                          name={color.name}
                          skuCount={skus.filter((s) => s.color === color.name).length}
                          onConfirm={() => onDeleteColor(color.id)}
                        />
                      </div>
                      <ColorPhotosControl
                        productId={productId}
                        color={color}
                        disabled={disabled}
                        onPhotosChange={(photos) => onColorPhotosChange(color.id, photos)}
                      />
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
