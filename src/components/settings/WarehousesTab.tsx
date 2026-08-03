"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WAREHOUSE_TYPE_OPTIONS } from "@/lib/constants/warehouse-options";
import type { WarehouseRow } from "@/server/data/warehouses";
import { deleteWarehouseAction } from "@/app/settings/warehouses/actions";

function typeLabel(type: string): string {
  return WAREHOUSE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function DeleteWarehouseButton({
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
        render={<Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити склад ${name}`} />}
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити склад?</DialogTitle>
          <DialogDescription>Склад «{name}» буде видалено остаточно.</DialogDescription>
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

export function WarehousesTab({ warehouses }: { warehouses: WarehouseRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDelete(id: string) {
    setActionError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteWarehouseAction(id);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити склад");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Склади й точки продажу тенанта.</p>
        <Link href="/settings/warehouses/new" className={buttonVariants({})}>
          <Plus className="size-4" />
          Додати склад
        </Link>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Назва</TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell>
                    <Link href={`/settings/warehouses/${warehouse.id}`} className="text-foreground hover:underline">
                      {warehouse.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{warehouse.code}</TableCell>
                  <TableCell className="text-muted-foreground">{typeLabel(warehouse.type)}</TableCell>
                  <TableCell>
                    <Badge variant={warehouse.isActive ? "success" : "secondary"}>
                      {warehouse.isActive ? "Активний" : "Не активний"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/settings/warehouses/${warehouse.id}`}
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        aria-label={`Редагувати склад ${warehouse.name}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <DeleteWarehouseButton
                        name={warehouse.name}
                        disabled={pendingId === warehouse.id}
                        onConfirm={() => handleDelete(warehouse.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {warehouses.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Ще немає жодного складу
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
