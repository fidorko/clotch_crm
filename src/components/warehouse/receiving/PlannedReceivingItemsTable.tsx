"use client";

import { useRef, useState } from "react";
import { ImageIcon, MoreVertical, ScanLine, Search, Trash2 } from "lucide-react";
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
import { ProductSkuCombobox } from "@/components/products/ProductSkuCombobox";
import { playScanBeep } from "@/lib/warehouse/scan-beep";
import { cn } from "@/lib/utils";
import type { ReceivingItem } from "@/lib/types/receiving";
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

// Презентаційна таблиця — сама нічого не персистує (мутації в
// PlannedReceivingWorkspace). Один документ, не два типи (warehouse-receiving.md,
// 2026-08-05): «Замовлено» рендериться лише для планового (showOrderedColumn),
// «Прийнято» — завжди, але редаговане лише коли receivedEditable (для
// планового — після «Прийняти на склад», для простого — від створення).
// «Замовлено» лишається редагованим навіть після початку приймання (пряма
// вказівка людини) — orderedEditable, а не завжди-read-only після якогось кроку.
export function PlannedReceivingItemsTable({
  showOrderedColumn,
  orderedEditable,
  receivedEditable,
  locked,
  items,
  skuCatalog,
  onScanOrAdd,
  onUpdateOrdered,
  onUpdateReceived,
  onRemoveItem,
  onRemoveItems,
}: {
  showOrderedColumn: boolean;
  orderedEditable: boolean;
  receivedEditable: boolean;
  locked: boolean;
  items: ReceivingItem[];
  skuCatalog: ProductSkuCatalogItem[];
  onScanOrAdd: (sku: ProductSkuCatalogItem) => void;
  onUpdateOrdered: (itemId: string, ordered: number) => void;
  onUpdateReceived: (itemId: string, received: number) => void;
  onRemoveItem: (itemId: string) => void;
  onRemoveItems: (itemIds: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const columnCount = 10 + (showOrderedColumn ? 1 : 0);

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
    onRemoveItems(selectedIds);
    setSelectedIds([]);
  }

  function removeItem(id: string) {
    onRemoveItem(id);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  // Сканування — максимально швидко, без затримок (пряма вказівка людини):
  // синхронний пошук у вже завантаженому каталозі, без debounce/мережі.
  // Enter — термінатор скану (стандартна поведінка USB/BT-сканерів, що
  // емулюють клавіатуру). Той самий ШК ще раз — кількість +1 (на активному
  // полі), інший ШК — додається інший товар. Куди саме йде +1 (ordered чи
  // received) вирішує workspace через qtyField у onScanOrAdd.
  function handleScan() {
    if (locked) return;
    const code = search.trim();
    if (!code) return;
    const match = skuCatalog.find((s) => s.barcode === code || s.sku === code);
    if (!match) return;
    onScanOrAdd(match);
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
              disabled={locked}
              placeholder="Пошук за назвою, SKU або штрихкодом — Enter скановує"
              className="pl-9"
            />
          </div>
          <Button
            variant="default"
            className="shrink-0"
            disabled={locked}
            onClick={() => searchRef.current?.focus()}
          >
            <ScanLine className="size-4" />
            Сканувати штрихкод
          </Button>
        </div>

        {someSelected && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Обрано: {selectedIds.length}</span>
            <Button variant="destructive" size="sm" onClick={removeSelected} disabled={locked}>
              <Trash2 className="size-3.5" />
              Видалити обрані
            </Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  disabled={locked}
                  aria-label="Виділити всі"
                />
              </TableHead>
              <TableHead>№</TableHead>
              <TableHead>Фото</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>ШК</TableHead>
              <TableHead>Назва товару</TableHead>
              <TableHead>Колір</TableHead>
              <TableHead>Розмір</TableHead>
              {showOrderedColumn && <TableHead className="text-right">Планова кількість</TableHead>}
              <TableHead className="text-right">Прийнято</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item, index) => (
              <TableRow
                key={item.id}
                className={cn(
                  showOrderedColumn && item.ordered === item.received && item.ordered > 0 && "bg-success/10 hover:bg-success/15"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                    disabled={locked}
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
                {showOrderedColumn && (
                  <TableCell className="text-right">
                    {orderedEditable ? (
                      <Input
                        type="number"
                        min={0}
                        value={item.ordered}
                        onChange={(e) => onUpdateOrdered(item.id, Math.max(0, Number(e.target.value)))}
                        className="h-7 w-16 text-right"
                      />
                    ) : (
                      <span className="text-muted-foreground">{item.ordered}</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  {receivedEditable ? (
                    <Input
                      type="number"
                      min={0}
                      value={item.received}
                      onChange={(e) => onUpdateReceived(item.id, Math.max(0, Number(e.target.value)))}
                      className="h-7 w-16 text-right"
                    />
                  ) : (
                    <span className="text-muted-foreground">{item.received}</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      disabled={locked}
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
            ))}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="py-8 text-center text-muted-foreground">
                  {showOrderedColumn ? "Ще немає жодного товару в плані" : "Ще немає жодної прийнятої позиції"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {!locked && (
          <ProductSkuCombobox
            catalog={skuCatalog}
            excludeIds={items.map((item) => item.productSkuId)}
            onAdd={onScanOrAdd}
          />
        )}
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
