"use client";

import { useRef, useState } from "react";
import { ImageIcon, MoreVertical, ScanLine, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddSkuCombobox } from "@/components/warehouse/receiving/AddSkuCombobox";
import { playScanBeep } from "@/lib/warehouse/scan-beep";
import { RECEIVING_ITEM_STATUS_META, computeReceivingItemStatus, type ReceivingItem } from "@/lib/types/receiving";
import type { ProductSkuCatalogItem } from "@/server/data/product-skus";

function ItemThumb({ url, alt, onOpen }: { url: string | null; alt: string; onOpen: () => void }) {
  if (!url) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground/50">
        <ImageIcon className="size-3.5" />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block size-8 shrink-0 overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80"
      aria-label={`Переглянути фото — ${alt}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- та сама причина, що ProductPhotoGallery: байти в БД */}
      <img src={url} alt={alt} className="size-full object-cover" />
    </button>
  );
}

export function PlannedReceivingItemsTable({
  items,
  onItemsChange,
  skuCatalog,
}: {
  items: ReceivingItem[];
  onItemsChange: (items: ReceivingItem[]) => void;
  skuCatalog: ProductSkuCatalogItem[];
}) {
  const [search, setSearch] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.sku.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      (item.barcode ?? "").includes(q)
    );
  });

  const allSelected = filtered.length > 0 && filtered.every((item) => selectedIds.includes(item.id));
  const someSelected = selectedIds.length > 0;

  function updateOrdered(id: string, ordered: number) {
    onItemsChange(
      items.map((item) =>
        item.id === id ? { ...item, ordered, status: computeReceivingItemStatus(ordered, item.received) } : item
      )
    );
  }

  function updateReceived(id: string, received: number) {
    onItemsChange(
      items.map((item) =>
        item.id === id
          ? { ...item, received, status: computeReceivingItemStatus(item.ordered, received) }
          : item
      )
    );
  }

  function removeItem(id: string) {
    onItemsChange(items.filter((item) => item.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !filtered.some((item) => item.id === id))
        : [...prev, ...filtered.filter((item) => !prev.includes(item.id)).map((item) => item.id)]
    );
  }

  function removeSelected() {
    onItemsChange(items.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
  }

  function addSku(sku: ProductSkuCatalogItem) {
    onItemsChange([
      ...items,
      {
        id: sku.id,
        sku: sku.sku,
        barcode: sku.barcode,
        photoUrl: sku.photoUrl,
        productName: sku.productName,
        color: sku.color,
        colorHex: sku.colorHex,
        size: sku.size,
        ordered: 1,
        received: 0,
        status: "not_accepted",
      },
    ]);
  }

  // Сканування — максимально швидко, без затримок (пряма вказівка людини):
  // синхронний пошук у вже завантаженому каталозі, без debounce/мережі.
  // Enter — термінатор скану (стандартна поведінка USB/BT-сканерів, що
  // емулюють клавіатуру). Той самий ШК ще раз — кількість +1, інший ШК —
  // додається інший товар.
  function handleScan() {
    const code = search.trim();
    if (!code) return;
    const match = skuCatalog.find((s) => s.barcode === code || s.sku === code);
    if (!match) return;

    const existingIndex = items.findIndex((item) => item.id === match.id);
    if (existingIndex === -1) {
      onItemsChange([
        ...items,
        {
          id: match.id,
          sku: match.sku,
          barcode: match.barcode,
          photoUrl: match.photoUrl,
          productName: match.productName,
          color: match.color,
          colorHex: match.colorHex,
          size: match.size,
          ordered: 1,
          received: 0,
          status: computeReceivingItemStatus(1, 0),
        },
      ]);
    } else {
      onItemsChange(
        items.map((item, i) => {
          if (i !== existingIndex) return item;
          const ordered = item.ordered + 1;
          return { ...item, ordered, status: computeReceivingItemStatus(ordered, item.received) };
        })
      );
    }
    playScanBeep();
    setSearch("");
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan();
    }
  }

  return (
    <Card className="gap-4 p-4">
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-lg font-semibold text-foreground">Товари</span>
          <Button variant="ghost" size="icon-sm" aria-label="Дії">
            <MoreVertical className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Пошук за назвою, SKU або штрихкодом — Enter скановує"
              className="pl-9"
            />
          </div>
          <Button variant="default" className="shrink-0" onClick={() => searchRef.current?.focus()}>
            <ScanLine className="size-4" />
            Сканувати штрихкод
          </Button>
        </div>

        {someSelected && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Обрано: {selectedIds.length}</span>
            <Button variant="destructive" size="sm" onClick={removeSelected}>
              <Trash2 className="size-3.5" />
              Видалити обрані
            </Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Виділити всі" />
              </TableHead>
              <TableHead>№</TableHead>
              <TableHead>Фото</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>ШК</TableHead>
              <TableHead>Назва товару</TableHead>
              <TableHead>Колір</TableHead>
              <TableHead>Розмір</TableHead>
              <TableHead className="text-right">Замовлено</TableHead>
              <TableHead className="text-right">Прийнято</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item, index) => {
              const status = RECEIVING_ITEM_STATUS_META[item.status];
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      aria-label={`Виділити ${item.sku}`}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <ItemThumb
                      url={item.photoUrl}
                      alt={`${item.productName}, ${item.color}`}
                      onOpen={() => item.photoUrl && setLightboxUrl(item.photoUrl)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{item.sku}</TableCell>
                  <TableCell className="text-muted-foreground">{item.barcode ?? "—"}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-3.5 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      {item.color}
                    </div>
                  </TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      value={item.ordered}
                      onChange={(e) => updateOrdered(item.id, Math.max(0, Number(e.target.value)))}
                      className="h-7 w-16 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      value={item.received}
                      onChange={(e) => updateReceived(item.id, Math.max(0, Number(e.target.value)))}
                      className="h-7 w-16 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.badge} className="gap-1">
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        aria-label={`Дії з рядком ${item.sku}`}
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => removeItem(item.id)}>Видалити</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                  Ще немає жодного товару в плані
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <AddSkuCombobox catalog={skuCatalog} excludeIds={items.map((item) => item.id)} onAdd={addSku} />
      </CardContent>

      <Dialog open={Boolean(lightboxUrl)} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Фото товару</DialogTitle>
          {lightboxUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- байти в БД, next/image не роздає такі шляхи
            <img src={lightboxUrl} alt="Фото товару" className="max-h-[80vh] w-full rounded-lg object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
