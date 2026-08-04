"use client";

import { useState } from "react";
import { MoreVertical, Plus, ScanLine, Search, Shirt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  MOCK_BIN_CELLS,
  MOCK_RECEIVING_ITEMS,
  RECEIVING_STATUS_META,
  type ReceivingLineItem,
} from "@/lib/mocks/receiving";

// Швидке/фактичне надходження — мок-рядки (немає бекенду поставок), окремо
// від планового (PlannedReceivingItemsTable — реальний каталог SKU, скан,
// автозбереження, warehouse-receiving.md).
function statusForCounts(ordered: number, received: number): ReceivingLineItem["status"] {
  if (received <= 0) return "not_accepted";
  if (received >= ordered) return "accepted";
  return "partial";
}

function textIsDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

export function ReceivingItemsTable() {
  const [items, setItems] = useState<ReceivingLineItem[]>(MOCK_RECEIVING_ITEMS);
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return item.sku.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q);
  });

  function updateReceived(id: string, received: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, received, status: statusForCounts(item.ordered, received) }
          : item
      )
    );
  }

  function updateCell(id: string, cell: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, cell } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за назвою, SKU або штрихкодом"
              className="pl-9"
            />
          </div>
          <Button variant="default" className="shrink-0">
            <ScanLine className="size-4" />
            Сканувати штрихкод
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>№</TableHead>
              <TableHead>Фото</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Назва товару</TableHead>
              <TableHead>Колір</TableHead>
              <TableHead>Розмір</TableHead>
              <TableHead className="text-right">Замовлено</TableHead>
              <TableHead className="text-right">Прийнято</TableHead>
              <TableHead>Комірка</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item, index) => {
              const status = RECEIVING_STATUS_META[item.status];
              return (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <div
                      className="flex size-8 items-center justify-center rounded-md border border-border"
                      style={{ backgroundColor: item.colorHex }}
                    >
                      <Shirt
                        className={cn("size-4", textIsDark(item.colorHex) ? "text-foreground/70" : "text-white/90")}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{item.sku}</TableCell>
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
                  <TableCell className="text-right text-muted-foreground">{item.ordered}</TableCell>
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
                    <Select value={item.cell ?? undefined} onValueChange={(v) => v && updateCell(item.id, v)}>
                      <SelectTrigger size="sm" className="w-28">
                        <SelectValue placeholder="Оберіть" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_BIN_CELLS.map((cell) => (
                          <SelectItem key={cell} value={cell}>
                            {cell}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                  Нічого не знайдено
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Button variant="outline" className="w-fit">
          <Plus className="size-4" />
          Додати товар
        </Button>
      </CardContent>
    </Card>
  );
}
