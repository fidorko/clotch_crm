"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { buildCategoryTree, getDescendantIds } from "@/lib/categories/tree";
import { resolveEffectiveIsActive } from "@/lib/categories/inheritance";
import type { CategoryRow } from "@/server/data/categories";
import {
  deleteCategoriesAction,
  deleteCategoryAction,
  toggleCategoryActiveAction,
} from "@/app/settings/categories/actions";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Усі статуси" },
  { value: "active", label: "Активні" },
  { value: "inactive", label: "Приховані" },
] as const;

function DeleteCategoryButton({
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
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={`Видалити категорію ${name}`}
          />
        }
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити категорію?</DialogTitle>
          <DialogDescription>
            Категорію «{name}» буде видалено. Якщо в неї є дочірні категорії, видалення
            відхилиться — спершу видаліть або перемістіть їх.
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
          <DialogTitle>Видалити вибрані категорії?</DialogTitle>
          <DialogDescription>
            Буде видалено {count} {count === 1 ? "категорію" : "категорій"}. Якщо серед вибраних є
            батьківська з дочірньою поза вибором — саме її видалення відхилиться, решта видаляться.
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

// Батьківська категорія без власних товарів показує суму товарів дітей (рекурсивно).
function effectiveProductCount(
  categoryId: string,
  categories: CategoryRow[],
  productCounts: Record<string, number>
): number {
  const direct = productCounts[categoryId] ?? 0;
  const children = categories.filter((c) => c.parentId === categoryId);
  return direct + children.reduce((sum, child) => sum + effectiveProductCount(child.id, categories, productCounts), 0);
}

export function CategoriesTab({
  categories,
  productCounts,
}: {
  categories: CategoryRow[];
  productCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(categories.filter((c) => categories.some((x) => x.parentId === c.id)).map((c) => c.id))
  );

  const isFiltering = appliedSearch.trim() !== "" || appliedStatus !== "all";

  const rows = useMemo(() => {
    if (!isFiltering) return buildCategoryTree(categories, expandedIds);

    // Під час пошуку/фільтра ієрархія не показується — плаский список збігів.
    const query = appliedSearch.trim().toLowerCase();
    return categories
      .filter((category) => {
        const matchesSearch = category.name.toLowerCase().includes(query);
        const effectiveIsActive = resolveEffectiveIsActive(categories, category.id);
        const matchesStatus =
          appliedStatus === "all" ||
          (appliedStatus === "active" ? effectiveIsActive : !effectiveIsActive);
        return matchesSearch && matchesStatus;
      })
      .map((category) => ({ category, depth: 0, hasChildren: false }));
  }, [categories, isFiltering, appliedSearch, appliedStatus, expandedIds]);

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.category.id));
  const someSelected = selectedIds.length > 0;

  function applyFilters() {
    setAppliedSearch(search);
    setAppliedStatus(statusFilter);
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !rows.some((r) => r.category.id === id))
        : [...prev, ...rows.filter((r) => !prev.includes(r.category.id)).map((r) => r.category.id)]
    );
  }

  // Виділення категорії каскадно виділяє (чи знімає) усіх її нащадків у таблиці.
  function toggleSelect(id: string) {
    const descendantIds = getDescendantIds(categories, id);
    setSelectedIds((prev) => {
      const willSelect = !prev.includes(id);
      if (willSelect) {
        const toAdd = [id, ...descendantIds].filter((x) => !prev.includes(x));
        return [...prev, ...toAdd];
      }
      const toRemove = new Set([id, ...descendantIds]);
      return prev.filter((x) => !toRemove.has(x));
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleActive(category: CategoryRow) {
    setActionError(null);
    setPendingId(category.id);
    startTransition(async () => {
      try {
        await toggleCategoryActiveAction(category.id, !resolveEffectiveIsActive(categories, category.id));
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося змінити статус");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleDelete(id: string) {
    setActionError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteCategoryAction(id);
        setSelectedIds((prev) => prev.filter((x) => x !== id));
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити категорію");
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
        const { deletedCount, failed } = await deleteCategoriesAction(selectedIds);
        if (failed.length > 0) {
          setActionError(
            `Видалено ${deletedCount} з ${selectedIds.length}. Не вдалося: ${failed
              .map((f) => f.name)
              .join(", ")} (мають дочірні категорії поза вибором)`
          );
        }
        setSelectedIds([]);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити вибрані категорії");
      } finally {
        setIsBulkDeleting(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Структура каталогу на вітрині.</p>
        <Link href="/settings/categories/new" className={buttonVariants({})}>
          <Plus className="size-4" />
          Додати категорію
        </Link>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          <div className="flex items-center gap-2 p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук категорій..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
              <SelectTrigger className="w-44">
                <SelectValue>
                  {(value: string) =>
                    STATUS_FILTER_OPTIONS.find((option) => option.value === value)?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={applyFilters}>
              Застосувати
            </Button>
          </div>

          <div className="flex items-center gap-3 p-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
              Виділити
            </label>
            <Select defaultValue="delete">
              <SelectTrigger className="h-8 max-w-xs flex-1">
                <SelectValue>{() => "Видалити вибрані"}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="delete">Видалити вибрані</SelectItem>
              </SelectContent>
            </Select>
            <DeleteSelectedButton
              count={selectedIds.length}
              disabled={!someSelected || isBulkDeleting}
              onConfirm={handleDeleteSelected}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8" />
                <TableHead className="w-8" />
                <TableHead>Категорія</TableHead>
                <TableHead className="text-right">Товарів</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ category, depth, hasChildren }) => {
                const isExpanded = expandedIds.has(category.id);
                const isRowPending = pendingId === category.id;
                const effectiveIsActive = resolveEffectiveIsActive(categories, category.id);
                return (
                  <TableRow key={category.id}>
                    <TableCell className="text-muted-foreground">
                      <GripVertical className="size-4" />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(category.id)}
                        onCheckedChange={() => toggleSelect(category.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: depth * 24 }}
                      >
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(category.id)}
                            aria-label={isExpanded ? "Згорнути категорію" : "Розгорнути категорію"}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ChevronRight
                              className={cn("size-4 transition-transform", isExpanded && "rotate-90")}
                            />
                          </button>
                        ) : (
                          <span className="size-4" />
                        )}
                        <span className="flex size-7 items-center justify-center rounded-md bg-accent text-muted-foreground">
                          {hasChildren && isExpanded ? (
                            <FolderOpen className="size-4" />
                          ) : (
                            <Folder className="size-4" />
                          )}
                        </span>
                        <Link
                          href={`/settings/categories/${category.id}`}
                          className={cn(
                            "text-foreground hover:underline",
                            hasChildren && "font-medium"
                          )}
                        >
                          {category.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {effectiveProductCount(category.id, categories, productCounts)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={effectiveIsActive ? "success" : "secondary"}>
                        {effectiveIsActive ? "Активна" : "Прихована"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isRowPending}
                          onClick={() => handleToggleActive(category)}
                          aria-label={
                            effectiveIsActive
                              ? `Приховати категорію ${category.name}`
                              : `Активувати категорію ${category.name}`
                          }
                        >
                          {effectiveIsActive ? (
                            <Eye className="size-4" />
                          ) : (
                            <EyeOff className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Переглянути категорію ${category.name}`}
                        >
                          <ExternalLink className="size-4" />
                        </Button>
                        <Link
                          href={`/settings/categories/${category.id}`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                          aria-label={`Редагувати категорію ${category.name}`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <DeleteCategoryButton
                          name={category.name}
                          disabled={isRowPending}
                          onConfirm={() => handleDelete(category.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Нічого не знайдено
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
