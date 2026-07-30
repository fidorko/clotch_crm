"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  Folder,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { mockCategories, type Category } from "@/lib/mocks/categories";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Усі статуси" },
  { value: "active", label: "Активні" },
  { value: "inactive", label: "Неактивні" },
] as const;

export function CategoriesTab() {
  const [categories] = useState<Category[]>(mockCategories);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const query = appliedSearch.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesSearch = category.name.toLowerCase().includes(query);
      const matchesStatus =
        appliedStatus === "all" ||
        (appliedStatus === "active" ? category.isActive : !category.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [categories, appliedSearch, appliedStatus]);

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));
  const someSelected = selectedIds.length > 0;

  function applyFilters() {
    setAppliedSearch(search);
    setAppliedStatus(statusFilter);
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !filtered.some((c) => c.id === id))
        : [...prev, ...filtered.filter((c) => !prev.includes(c.id)).map((c) => c.id)]
    );
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Структура каталогу на вітрині.</p>
        <Button>
          <Plus className="size-4" />
          Додати категорію
        </Button>
      </div>

      <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
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
        <Button variant="destructive" disabled={!someSelected}>
          <Trash2 className="size-4" />
          Видалити
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
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
            {filtered.map((category) => (
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
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-accent text-muted-foreground">
                      <Folder className="size-4" />
                    </span>
                    <span className="text-foreground">{category.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {category.productsCount}
                </TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "success" : "secondary"}>
                    {category.isActive ? "Активна" : "Неактивна"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Переглянути категорію ${category.name}`}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Редагувати категорію ${category.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Видалити категорію ${category.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Нічого не знайдено
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
