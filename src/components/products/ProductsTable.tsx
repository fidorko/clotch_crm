"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ImageIcon, Pencil, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryTreeSelect } from "@/components/categories/CategoryTreeSelect";
import { cn } from "@/lib/utils";
import { getCategoryPath } from "@/lib/categories/tree";
import type { CategoryRow } from "@/server/data/categories";
import type { ProductListItem, ProductStockFilter } from "@/server/data/products";
import type { ProductStatus } from "@/lib/types/product";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/constants/product-status";
import { deleteProductAction, deleteProductsAction } from "@/app/products/actions";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Усі статуси" },
  ...PRODUCT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
];

const STOCK_FILTER_OPTIONS: { value: ProductStockFilter; label: string }[] = [
  { value: "all", label: "Увесь залишок" },
  { value: "in_stock", label: "В наявності" },
  { value: "out_of_stock", label: "Немає в наявності" },
];

function formatCurrency(value: number): string {
  return `${value.toLocaleString("uk-UA")} грн`;
}

function statusOption(status: ProductStatus) {
  return PRODUCT_STATUS_OPTIONS.find((o) => o.value === status) ?? PRODUCT_STATUS_OPTIONS[0];
}

function ProductThumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground/50">
        <ImageIcon className="size-4" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- той самий підхід, що й ProductPhotoGallery
    <img src={url} alt={alt} className="size-10 shrink-0 rounded-md object-cover" />
  );
}

function DeleteProductButton({
  name,
  onConfirm,
  disabled,
}: {
  name: string;
  onConfirm: () => void;
  disabled: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити товар ${name}`} />
        }
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити товар?</DialogTitle>
          <DialogDescription>
            Товар «{name}» буде видалено разом з усіма SKU, фото й заданими замірами. Дію не можна
            скасувати.
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

function DeleteSelectedButton({
  count,
  onConfirm,
  disabled,
}: {
  count: number;
  onConfirm: () => void;
  disabled: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" disabled={disabled} />}>
        <Trash2 className="size-4" />
        Видалити
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити вибрані товари?</DialogTitle>
          <DialogDescription>
            Буде видалено {count} {count === 1 ? "товар" : "товарів"} разом з усіма SKU, фото й
            замірами. Дію не можна скасувати.
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

export function ProductsTable({
  items,
  total,
  page,
  pageSize,
  categories,
  filters,
}: {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  categories: CategoryRow[];
  filters: {
    search: string;
    categoryId: string;
    status: ProductStatus | "all";
    stock: ProductStockFilter;
  };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState(filters.search);
  const [categoryId, setCategoryId] = useState(filters.categoryId || "all");
  const [status, setStatus] = useState<string>(filters.status);
  const [stock, setStock] = useState<string>(filters.stock);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));
  const someSelected = selectedIds.length > 0;

  function navigate(next: { search?: string; categoryId?: string; status?: string; stock?: string; page?: number }) {
    const params = new URLSearchParams();
    const q = next.search ?? filters.search;
    const cat = next.categoryId ?? filters.categoryId;
    const st = next.status ?? filters.status;
    const sk = next.stock ?? filters.stock;
    const pg = next.page ?? 1;
    if (q) params.set("q", q);
    if (cat && cat !== "all") params.set("category", cat);
    if (st && st !== "all") params.set("status", st);
    if (sk && sk !== "all") params.set("stock", sk);
    if (pg > 1) params.set("page", String(pg));
    router.push(`/products${params.toString() ? `?${params}` : ""}`);
  }

  function applyFilters() {
    navigate({ search, categoryId, status, stock, page: 1 });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !items.some((i) => i.id === id))
        : [...prev, ...items.filter((i) => !prev.includes(i.id)).map((i) => i.id)]
    );
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleDelete(id: string) {
    setActionError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteProductAction(id);
        setSelectedIds((prev) => prev.filter((x) => x !== id));
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити товар");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleDeleteSelected() {
    setActionError(null);
    setIsBulkDeleting(true);
    startTransition(async () => {
      try {
        await deleteProductsAction(selectedIds);
        setSelectedIds([]);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити вибрані товари");
      } finally {
        setIsBulkDeleting(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          <div className="flex flex-wrap items-center gap-2 p-4">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук за назвою або артикулом..."
                className="pl-9"
              />
            </div>
            <CategoryTreeSelect
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              triggerClassName="w-44"
              noneOption={{ value: "all", label: "Усі категорії" }}
            />
            <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
              <SelectTrigger className="w-40">
                <SelectValue>
                  {(v: string) => STATUS_FILTER_OPTIONS.find((o) => o.value === v)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stock} onValueChange={(v) => setStock(v ?? "all")}>
              <SelectTrigger className="w-44">
                <SelectValue>
                  {(v: string) => STOCK_FILTER_OPTIONS.find((o) => o.value === v)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {STOCK_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={applyFilters}>
              Застосувати
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 p-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
              Виділити
            </label>
            <div className="flex items-center gap-3">
              <DeleteSelectedButton
                count={selectedIds.length}
                disabled={!someSelected || isBulkDeleting}
                onConfirm={handleDeleteSelected}
              />
              <span className="text-sm text-muted-foreground">
                {total} шт. · стор. {page}/{pageCount}
              </span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8" />
                <TableHead>Товар</TableHead>
                <TableHead className="text-right">Ціна</TableHead>
                <TableHead className="text-right">Залишок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isRowPending = pendingId === item.id;
                const category = item.categoryId
                  ? getCategoryPath(categories, item.categoryId)
                      .map((c) => c.name)
                      .join(" / ")
                  : "";
                const badge = statusOption(item.status);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductThumb url={item.photoUrl} alt={item.name} />
                        <div className="flex flex-col gap-0.5">
                          <Link href={`/products/${item.id}`} className="font-medium text-foreground hover:underline">
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{item.modelCode}</span>
                            {category && <span>· {category}</span>}
                            <span>· {item.createdAt}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col">
                        <span className="text-foreground">{formatCurrency(item.retailPrice)}</span>
                        <span className="text-xs text-muted-foreground">
                          соб. {formatCurrency(item.purchasePrice)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalStock === 0 ? (
                        <Badge variant="destructive">Немає</Badge>
                      ) : (
                        <span className="text-foreground">{item.totalStock}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.badgeVariant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/products/${item.id}`}
                          target="_blank"
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                          aria-label={`Відкрити товар ${item.name} у новій вкладці`}
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                        <Link
                          href={`/products/${item.id}`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                          aria-label={`Редагувати товар ${item.name}`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <DeleteProductButton
                          name={item.name}
                          disabled={isRowPending}
                          onConfirm={() => handleDelete(item.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Нічого не знайдено
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end gap-2 p-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: page - 1 })}
            >
              Назад
            </Button>
            <span className={cn("text-sm text-muted-foreground")}>
              стор. {page}/{pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => navigate({ page: page + 1 })}
            >
              Далі
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
