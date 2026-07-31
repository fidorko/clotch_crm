"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Pencil, Search, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SUPPLIER_TYPE_OPTIONS } from "@/lib/constants/supplier-options";
import type { SupplierListItem } from "@/server/data/suppliers";
import { deleteSupplierAction } from "@/app/settings/references/suppliers/actions";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Статус: усі" },
  { value: "active", label: "Активний" },
  { value: "inactive", label: "Не активний" },
];

const AVATAR_PALETTE = [
  "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
];

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function avatarColorFor(id: string): string {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

function typeOption(type: string) {
  return SUPPLIER_TYPE_OPTIONS.find((o) => o.value === type);
}

function formatUpdatedAt(date: Date): { day: string; time: string } {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    day: `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function DeleteSupplierButton({
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
        render={<Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити ${name}`} />}
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити постачальника?</DialogTitle>
          <DialogDescription>
            Постачальника «{name}» та всі його контакти й канали зв&apos;язку буде видалено безповоротно.
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

export function SuppliersList({ suppliers }: { suppliers: SupplierListItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (typeFilter !== "all" && supplier.type !== typeFilter) return false;
      if (statusFilter === "active" && !supplier.isActive) return false;
      if (statusFilter === "inactive" && supplier.isActive) return false;
      if (!q) return true;
      return (
        supplier.name.toLowerCase().includes(q) ||
        supplier.code.toLowerCase().includes(q) ||
        (supplier.primaryContact?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [suppliers, search, typeFilter, statusFilter]);

  function handleDelete(id: string) {
    setError(null);
    setPendingDeleteId(id);
    startTransition(async () => {
      try {
        await deleteSupplierAction(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося видалити постачальника");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за назвою, кодом, контактом..."
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue>
              {(value: string) => (value === "all" ? "Тип постачальника" : typeOption(value)?.label)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">Усі типи</SelectItem>
            {SUPPLIER_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue>
              {(value: string) => STATUS_FILTER_OPTIONS.find((o) => o.value === value)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Постачальник</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  Оновлено
                  <ChevronDown className="size-3.5" />
                </span>
              </TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((supplier) => {
              const type = typeOption(supplier.type);
              const updated = formatUpdatedAt(supplier.updatedAt);
              return (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColorFor(supplier.id)}`}
                      >
                        {initialsFor(supplier.name)}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">{supplier.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{supplier.code}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {type && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${type.colorClass}`}
                      >
                        <type.icon className="size-3.5" />
                        {type.label}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {supplier.primaryContact ? (
                      <div className="flex flex-col text-xs">
                        <span className="text-sm text-foreground">{supplier.primaryContact.name}</span>
                        {supplier.primaryContact.phone && (
                          <span className="text-muted-foreground">{supplier.primaryContact.phone}</span>
                        )}
                        {supplier.primaryContact.email && (
                          <span className="text-muted-foreground">{supplier.primaryContact.email}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span
                        className={`size-2 shrink-0 rounded-full ${supplier.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`}
                      />
                      {supplier.isActive ? "Активний" : "Не активний"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="text-sm text-foreground">{updated.day}</span>
                      <span className="text-muted-foreground">{updated.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/settings/references/suppliers/${supplier.id}`}
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        aria-label={`Редагувати ${supplier.name}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <DeleteSupplierButton
                        name={supplier.name}
                        disabled={pendingDeleteId === supplier.id}
                        onConfirm={() => handleDelete(supplier.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {suppliers.length === 0
              ? "Постачальників ще немає — натисніть «Додати постачальника»"
              : "Нічого не знайдено за цими фільтрами"}
          </p>
        )}
      </div>
    </div>
  );
}
